---
name: monozen-architecture
description: Monozen portfolio system architecture - 5-panel SPA structure, dual-theme lifecycle contracts, CSS specificity load order, panel switching state machine, and asset structure. Use when working on core portfolio architecture.
---

# Monozen System Architecture

## Architecture Overview

Monozen is constructed as a **zero-dependency, single-page application (SPA)** designed for instant response times, zero framework bloat, and complete theme isolation.

```
┌─────────────────────────────────────────────────────────────────┐
│                       HTML5 SPA Shell                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Nav Capsule (fixed)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [01 FOCUS] [02 WORK] [03 PROJECTS] [04 REGISTRY] [05 TOOL]│  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           WebGL Canvas Layer / Shader Background          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Structural Decisions & Rationale

### 1. Dual-Theme Lifecycle Isolation
- **Contract**: Every theme exposes global entry lifecycle functions:
  - `window.__moonInit()` / `window.__moonDestroy()`
  - `window.__sunInit()` / `window.__sunDestroy()`
- **Rationale**: Prevents memory leaks and conflicting render loops. When switching themes, `_doThemeSwitch()` in `boot.js` invokes the outgoing theme's `__destroy()` function before initializing the incoming theme.

### 2. CSS Specificity & Link Order Rule
- **Order in `<head>`**:
  ```html
  <link rel="stylesheet" href="assets/tailwind.css">
  <link rel="stylesheet" href="assets/main.css">
  <link rel="stylesheet" href="assets/moon.css">
  <link rel="stylesheet" href="assets/sun.css">
  ```
- **Rationale**: `:root` variables in `main.css` and `[data-theme="moon"]` in `moon.css` have identical CSS specificity (`0-1-0`). `main.css` MUST load before `moon.css` so dark theme overrides apply correctly.

### 3. 5-Panel SPA State Machine
- **Panels**: `focus`, `work`, `projects`, `registry`, `toolchain`.
- **Panel Router**: `window.switchPanel(panelId)` in `panel-system.js`.
- **Keyboard Navigation**: Keys `1` through `5` trigger instant panel switching.
- **Mobile Gestures**: Horizontal swipe triggers directional panel cycling.

---

## Core File Boundaries

- `index.html`: SPA shell containing layout structure and inline SVG definitions.
- `assets/main.css`: Shared layout rules and unprefixed token declarations.
- `assets/moon.css`: Moon-specific styles (`[data-theme="moon"]`).
- `assets/sun.css`: Sun-specific styles (`[data-theme="sun"]`).
- `assets/js/boot.js`: Bootloader, theme switcher, split-screen picker, WebGL context management.
- `assets/js/panel-system.js`: Panel switching, navigation slider, and HUD corner bracket tracking.
- `assets/js/shared.js`: Modal windows, Ask terminal router, telemetry logging, GSAP loader.
