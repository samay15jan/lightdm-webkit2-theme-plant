const START_DATE = new Date("2026-02-10T00:00:00");

function getAge() {
  const now = new Date();

  let years = now.getFullYear() - START_DATE.getFullYear();
  let months = now.getMonth() - START_DATE.getMonth();
  let days = now.getDate() - START_DATE.getDate();

  if (days < 0) {
    months--;
    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    ).getDate();

    days += previousMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diff =
    now -
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      START_DATE.getHours(),
      START_DATE.getMinutes(),
      START_DATE.getSeconds()
    );

  const totalSeconds = Math.floor(diff / 1000);

  return {
    years,
    months,
    days,
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
  };
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderAge() {
  const age = getAge();
  const el = document.getElementById("age-clock");
  if (el) el.textContent = `${age.years}y ${age.months}m ${age.days}d`;
}

document.getElementById("birth-date").textContent = formatDate(START_DATE);
renderAge();
setInterval(renderAge, 1000);


const WAVE_BARS = Array.from(
  { length: 28 },
  (_, i) => 0.35 + ((i * 37) % 65) / 100
);
const waveEl = document.getElementById("wave");
WAVE_BARS.forEach((seed, i) => {
  const bar = document.createElement("span");
  bar.className = "wave-bar";
  bar.style.setProperty("--seed", seed);
  bar.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
  waveEl.appendChild(bar);
});
waveEl.classList.add("is-playing");
