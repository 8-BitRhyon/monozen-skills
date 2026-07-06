---
name: monozen-architecture
description: Monozen portfolio system architecture — 5-panel SPA, dual-theme lifecycle, file structure, panel system, theme decoupling, JS loading strategy. Use when working on the Monozen portfolio at Portfolio/Website/.
---

# Monozen Architecture

## Project Location
`/Users/rhyon/Downloads/Self Curated CS Curriculum/Projects/Portfolio/Website/`

## File Structure
```
index.html             # SPA shell (99KB)
sw.js                  # Service worker (asset pre-cache)
nlp.js                 # Ask-terminal keyword router
globe-module.js        # Three.js globe (lazy-loaded)
package.json           # Tailwind build, ESLint, Prettier
node_modules/@paper-design/shaders/  # Apache 2.0 WebGL2 shaders
brand/                 # Nav mark + favicon asset ladder
assets/
  main.css             # SHARED: resets, tokens, layout, unprefixed selectors
  sun.css              # SUN-ONLY: [data-theme="sun"] selectors (285 lines)
  moon.css             # MOON-ONLY: [data-theme="moon"] selectors (366 lines)
  tailwind.css         # Built (gitignored)
  js/
    shared.js          # SHARED: modal, ask terminal, telemetry, GSAP loader
    boot.js            # Boot loader, split-screen, WebGL shaders, finishBoot, theme toggle
    audio.js           # Theme transition sounds (Web Audio)
    app.js             # Moon core: bootlog, uptime, parallax, harvested data
    panel-system.js    # SHARED: panel switch, nav slider, nav corners, caliper, filters
    paper-portrait.js  # ZT WebGL2 halftone portrait shader + 2D fallback
    sun-shader.js      # FoldGradient Sun background shader
    sun-panel.js       # SUN: crosshair guides, sheet-flip, pen stroke, reticle
    sun-stamps.js      # SUN: stamp tool (palette, localStorage)
    sun-content.js     # SUN: Bayer dither (will be replaced by PaperTexture), schematics
    moon-browser.js    # MOON: project index browser + preview console
    moon-cursor.js     # MOON: reticle cursor, glitch trail, snap, hold, scroll rail
```

## Theme Lifecycle
- `data-theme` attribute on `<html>` — all CSS gates via `[data-theme="moon/sun"]`
- `theme-changed` CustomEvent dispatched after every toggle
- Theme toggle calls `__[outgoingTheme]Destroy()` then `__[incomingTheme]Init()`
- **Moon**: `__moonCursorInit/Destroy` in moon-cursor.js
- **Sun**: `__sunInit` in app.js, `__sunDestroy` (FoldGradient dispose function)

## Panel System
- 5 panels: focus, work, projects, registry, toolchain
- `window.switchPanel(panelId)` in panel-system.js
- Nav slider (`#navSlider`) tracks active via `offsetWidth` + `offsetLeft`
- Corner brackets (`#navCornerGroup`) use GSAP Flip on panel switch (Moon-only)
- Keyboard 1-5 mapped to panels
- Mobile swipe gesture for panel cycling

## CSS Architecture
- All theme-gated selectors migrated to `sun.css` / `moon.css` — zero `[data-theme=]` in `main.css`
- Shared/base selectors remain in `main.css`
- Both loaded unconditionally in `<head>` — safe due to `[data-theme]` prefixing
