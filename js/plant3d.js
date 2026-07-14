import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const wrap = document.getElementById("plant-canvas-wrap");

/* ---------------- Renderer ---------------- */

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.setClearColor(0x000000, 0);
wrap.appendChild(renderer.domElement);

/* ---------------- Scene / Camera ---------------- */

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xffffff, 10, 24);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.7, 9.5);
// react-three-fiber's default camera implicitly targets the world origin
// (0,0,0) — vanilla three.js does not, it just faces -Z. Without this,
// the model (centered at y=0 by the recenter logic) sits below screen
// center by an amount proportional to the camera's own y position.
camera.lookAt(0, 0, 0);

/* ---------------- Environment (procedural "studio" replacement) ---------------- */
/* drei's Environment preset="studio" loads an HDRI over the network.
   RoomEnvironment is three.js's built-in procedural stand-in — no
   network fetch required — combined with PMREM to light the scene. */

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
scene.environment = envRT.texture;
scene.environmentIntensity = 0.107;
pmremGenerator.dispose();

/* ---------------- Lights ---------------- */

const ambient = new THREE.AmbientLight(0xffffff, 0.02);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffe8c4, 2.2);
directional.position.set(8, 10, 6);
directional.castShadow = true;
directional.shadow.mapSize.set(1024, 1024);
scene.add(directional);

const spot = new THREE.SpotLight(0xffe8c4, 2);
spot.position.set(6, 8, 5);
spot.angle = 0.28;
spot.penumbra = 0.9;
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
scene.add(spot);
scene.add(spot.target);

const point = new THREE.PointLight(0x5f7392, 0.18);
point.position.set(-6, 3, -8);
scene.add(point);

/* ---------------- Groups ---------------- */

const rigGroup = new THREE.Group(); // draggable rig
const centerGroup = new THREE.Group(); // "Center disableX" replacement (recenter on Y/Z after load)
rigGroup.add(centerGroup);
scene.add(rigGroup);
// no manual Y offset here — matches the original <Rig><Center disableX> setup,
// which relies purely on the recenter math below for vertical placement

/* ---------------- Loading + material pass ---------------- */

const loader = new GLTFLoader();
// Work around file:// blob-fetch restriction: force GLTFLoader to use
// classic <img> texture loading instead of createImageBitmap()+fetch(),
// which Chromium/WebKit blocks for blob URLs under the file:// protocol.
if (typeof window !== "undefined") {
  window.createImageBitmap = undefined;
}

function applyMaterialPass(scene3d, { roughness, metalness, envMapIntensity }) {
  scene3d.traverse((obj) => {
    if (!obj.isMesh) return;

    obj.castShadow = true;
    obj.receiveShadow = true;

    const mat = obj.material;
    if (!mat) return;

    if (mat.emissiveMap) {
      mat.map = mat.emissiveMap;
      mat.emissiveMap = null;
    }

    mat.color.set("#ffffff");
    if (mat.emissive) mat.emissive.set("#000000");
    mat.emissiveIntensity = 0;
    mat.roughness = roughness;
    mat.metalness = metalness;
    mat.envMapIntensity = envMapIntensity;
    mat.needsUpdate = true;
  });
}

let plantObject = null;
let rockObject = null;

function recenterIfReady() {
  // Mirrors <Center disableX> — recenters the group on Y/Z once both
  // models are loaded, leaving X untouched.
  if (!plantObject || !rockObject) return;

  // Box3.setFromObject() relies on up-to-date world matrices, which aren't
  // guaranteed yet since this runs inside an async load callback rather
  // than the render loop — force an update first or the computed box (and
  // therefore the recenter offset) will be wrong.
  centerGroup.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(centerGroup);
  const center = box.getCenter(new THREE.Vector3());
  centerGroup.position.y -= center.y;
  centerGroup.position.z -= center.z;
}

loader.load(
  "./assets/models/plant.glb",
  (gltf) => {
    plantObject = gltf.scene;
    applyMaterialPass(plantObject, {
      roughness: 0.9,
      metalness: 0.01,
      envMapIntensity: 0.08,
    });
    plantObject.scale.setScalar(2);
    centerGroup.add(plantObject);
    recenterIfReady();
  },
  undefined,
  (err) => console.error("Failed to load plant.glb", err)
);

loader.load(
  "./assets/models/rock.glb",
  (gltf) => {
    rockObject = gltf.scene;
    applyMaterialPass(rockObject, {
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.03,
    });
    rockObject.position.set(0, -2, 0);
    rockObject.scale.setScalar(1.8);
    centerGroup.add(rockObject);
    recenterIfReady();
  },
  undefined,
  (err) => console.error("Failed to load rock.glb", err)
);

/* ---------------- Contact shadow (drei ContactShadows replacement) ---------------- */

const shadowPlaneGeo = new THREE.PlaneGeometry(3.5, 3.5);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.25 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.set(0, -2.5, 0);
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

/* ---------------- Drag rig ---------------- */

let dragging = false;
let last = { x: 0, y: 0 };
const rotation = { x: 0, y: 0 };
const mouse = { x: 0, y: 0 };
const hoverRotation = { x: 0, y: 0 };

window.addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  hoverRotation.y = mouse.x * 0.25;
  hoverRotation.x = -mouse.y * 0.12;
});

function onPointerDown(e) {
  e.stopPropagation();
  dragging = true;
  last = { x: e.clientX, y: e.clientY };
  document.body.style.cursor = "grabbing";
}

function onPointerMoveDrag(e) {
  if (!dragging) return;

  const dx = e.clientX - last.x;
  const dy = e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };

  rotation.y += dx * 0.01;
  rotation.x = THREE.MathUtils.clamp(rotation.x + dy * 0.008, -0.6, 0.6);
}

function onPointerUp() {
  dragging = false;
  document.body.style.cursor = "default";
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMoveDrag);
window.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointerleave", onPointerUp);

/* ---------------- Resize ---------------- */

function resize() {
  const width = wrap.clientWidth || 1;
  const height = wrap.clientHeight || 1;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("resize", resize);
resize();

/* ---------------- Animation loop ---------------- */

function animate() {
  requestAnimationFrame(animate);

  rigGroup.rotation.x = THREE.MathUtils.lerp(
    rigGroup.rotation.x,
    rotation.x + hoverRotation.x,
    0.08
  );

  rigGroup.rotation.y = THREE.MathUtils.lerp(
    rigGroup.rotation.y,
    rotation.y + hoverRotation.y,
    0.08
  );

  renderer.render(scene, camera);
}

animate();