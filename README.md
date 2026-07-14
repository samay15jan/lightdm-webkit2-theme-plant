# Plant


<p align="center">
  A modern and customizable LightDM WebKit2 theme.
</p>

<p align="center">
  <a href="https://aur.archlinux.org/packages/lightdm-webkit2-theme-plant">
    <img src="https://img.shields.io/aur/version/lightdm-webkit2-theme-plant?style=flat-square" alt="AUR Version">
  </a>
  <a href="https://aur.archlinux.org/packages/lightdm-webkit2-theme-plant">
    <img src="https://img.shields.io/aur/votes/lightdm-webkit2-theme-plant?style=flat-square" alt="AUR Votes">
  </a>
  <img src="https://img.shields.io/github/license/samay15jan/lightdm-webkit2-theme-plant?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/samay15jan/lightdm-webkit2-theme-plant?style=flat-square" alt="GitHub Stars">
</p>

<p align="center">
  <img src="plant.png" alt="Plant LightDM Theme" width="900">
</p>

---

## Features

- Modern interface
- Interactive 3D plant
- Multi-user support
- Session selection
- Power menu
- Keyboard navigation
- Customizable appearance
- Built with Vanilla JavaScript and Three.js

---

## Requirements

- lightdm
- lightdm-webkit2-greeter

---

## Installation

### AUR (Recommended)

```bash
yay -S lightdm-webkit2-theme-plant
```

or

```bash
paru -S lightdm-webkit2-theme-plant
```

### Manual

```bash
git clone https://github.com/samay15jan/lightdm-webkit2-theme-plant.git
cd lightdm-webkit2-theme-plant

sudo cp -r . /usr/share/lightdm-webkit/themes/plant
```

Configure LightDM.

`/etc/lightdm/lightdm.conf`

```ini
[Seat:*]
greeter-session=lightdm-webkit2-greeter
```

Configure the WebKit2 greeter.

`/etc/lightdm/lightdm-webkit2-greeter.conf`

```ini
webkit_theme = plant
debug_mode = true
```

Restart LightDM.

```bash
sudo systemctl restart lightdm
```

---

## Customization

Plant can be customized by modifying its source files.

You can customize:

- Wallpapers
- Colors
- Fonts
- Animations
- Layout
- JavaScript behavior
- 3D scene

---

## Credits

Plant is based on the original Glorious LightDM WebKit2 theme by **manilarome** and includes substantial visual and functional modifications.

---

## License

Licensed under the MIT License.