# ⚡ CYBER VIPER 2088 — Cyberpunk Neon Arcade Snake

> An ultra-premium, high-octane browser Snake arcade game engineered with pure HTML5 Canvas, modern Vanilla CSS, and a procedural Web Audio API sound engine.

---

## 🌟 Highlights

- **Aesthetics & Atmosphere**: Cyberpunk neon vector grid, glowing cyan-to-magenta viper segments, screen shake impacts, and toggleable retro CRT scanlines.
- **60–120 FPS Sub-Tick Interpolation**: Smooth fluid movement across the canvas without stuttering.
- **Synthesized Web Audio**: 100% procedurally generated retro sound effects and synthwave soundtrack using pure Web Audio API (zero external `.mp3` dependencies).
- **Dynamic Particle System**: Radial spark bursts, expanding shockwave rings, and ambient floating matrix dust motes.
- **Multiple Game Modes**: Classic Arcade, Hazard Matrix (with Warp Portals), Time Trial, and Zen Mode.
- **Responsive Controls**: Full keyboard support (`WASD` / Arrows / Space), touch swipes, and an on-screen Virtual D-Pad for mobile devices.

---

## 🎮 Game Modes

| Mode | Description |
| :--- | :--- |
| **Classic Arcade** | Velocity ramps up with each core absorbed; configurable wall wrap. |
| **Hazard Matrix** | Procedural laser barriers and coupled **Cyan ↔ Magenta Warp Portals** that teleport the viper through dimensional space! |
| **Time Trial** | 60-second frenzy with timed bonus pickups and score multipliers. |
| **Zen Flight** | Relaxed flow mode with infinite wall wrap and non-lethal self collisions. |

---

## ⚡ Quantum Pickups & Power-Ups

- **Cyan Data Cube** (`#00f0ff`): Core objective item. +10 PTS and fuels the **Combo Multiplier Gauge** (up to 5x).
- **Quantum Core** (`#ffe600`): Timed golden bonus orb appearing every 5 pickups with an animated countdown ring (+50 PTS).
- **Phase Shift (Ghost)** (`#a855f7`): Translucent holographic phase mode; grants 6 seconds of invulnerability through walls and own tail.
- **Turbo Surge** (`#ffe600`): Speed overclock with chromatic light trails and double points.
- **Cryo Freeze** (`#00f0ff`): Slow-motion time dilation for precise navigation.
- **EMP Magnet** (`#00ff66`): Magnetically attracts nearby data cubes into the viper head.
- **Warp Portals**: Step into the Cyan portal to warp instantly out of the Magenta portal.

---

## 🕹️ Controls

### Desktop
- **Steer**: `W` `A` `S` `D` or Arrow Keys (`▲` `◀` `▼` `▶`)
- **Pause / Tactical Freeze**: `SPACEBAR`
- **Settings / Exit**: `ESC`

### Mobile & Touch Devices
- **Virtual D-Pad**: Tap the on-screen direction arrows.
- **Touch Swipes**: Swipe directly anywhere on the canvas.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it locally:

```bash
# Using Python
python -m http.server 8080

# Using Node (npx)
npx serve .
```

Then visit `http://localhost:8080` in your browser.

---

## 📁 Project Architecture

```
├── index.html        # Semantic HTML5 layout, HUD telemetry, and overlays
├── css/
│   └── style.css     # Cyberpunk design system, scanlines, and responsive HUD
├── js/
│   ├── app.js        # Main initialization and DPI scaling
│   ├── audio.js      # Procedural Web Audio API sound & synthwave engine
│   ├── game.js       # Core grid physics, portals, power-ups, and renderer
│   ├── particles.js  # Canvas 2D spark explosions and shockwave system
│   └── ui.js         # HUD counters, high scores, modals, and input bindings
└── README.md
```

---

## 📄 License

MIT License. Free to use, modify, and build upon!
