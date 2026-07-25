---
name: monozen-nav
description: Monozen nav bar system architecture - glassmorphism capsule layout, corner brackets (GSAP Flip), brand crossfade on scroll, Sun/Moon theme gating, responsive breakpoints, and design rationale. Use when working on navigation UI, brand mark transitions, or nav layout.
---

# Monozen Navigation System

## Overview & Rationale

The navigation bar in Monozen is not a generic header; it is a **floating glass capsule** acting as an anchor between the two dual-persona themes.

- **Moon Mode (Systemizer)**: The nav acts as a targeting reticle frame. Four active SVG corner brackets (`#navCornerGroup`) dynamically lock onto the active panel item using GSAP `Flip`, simulating a tactical HUD targeting computer.
- **Sun Mode (Shaper)**: The nav transforms into a technical drafting toolbar. The HUD corner brackets retreat (`display: none`), stroke weights flatten to 1px, and the interactive stamp tool palette renders inside `.nav-toggles`.

---

## Architecture & Layout

```
 ┌─────────────────────────────────────────────────────────────────┐
 ┌─────────┬───────────────────────────────┬──────────────────────┐ │
 │ [MARK]  │ [01 FOCUS] [02 WORK] [03 PROJ]│ [STAMPS]  [THEME 🌓] │ │
 └─────────┴───────────────────────────────┴──────────────────────┘ │
 └───────────────────────────────[NAV CAPSULE]──────────────────────┘
```

- `<nav class="nav">`: Fixed top-center glassmorphism container (`backdrop-filter: blur(12px)`).
- `.nav-inner`: Flex container (`position: relative`) anchor point for corner brackets.
- `.nav-brand`: Dual-state brand component containing both text label (`.nav-brand-text`) and WebP logo (`.nav-brand-mark`).
- `.nav-links`: Panel links container featuring a 2px CSS sliding underline indicator (`#navSlider`).
- `.nav-toggles`: Right-aligned controls housing the theme toggle button and Sun stamp tool palette.

---

## Core Behavior Protocols

### 1. Brand Crossfade on Scroll
- **Rationale**: Preserves precious vertical screen space during long scroll reads while keeping identity visible.
- **Trigger**: Window scroll offset > 32px toggles `.nav.is-scrolled`.
- **States**:
  - `scrollTop <= 32px`: `.nav-brand-text` opacity = 1; `.nav-brand-mark` opacity = 0 (`pointer-events: none`).
  - `scrollTop > 32px`: `.nav-brand-text` opacity = 0; `.nav-brand-mark` opacity = 1 (`scale(1)`).
- **Reduced Motion**: Disables opacity transition; snaps instantly to state.

### 2. Corner Bracket GSAP Flip (Moon Theme Only)
- **Rationale**: Implements tactical reticle framing without layout thrashing.
- **Implementation**:
  ```javascript
  // panel-system.js: updateNavCorners(activeId, opts)
  const state = Flip.getState('#navCornerGroup');
  // Reposition corners around active target bounds
  Flip.from(state, { duration: 0.4, ease: 'power3.out' });
  ```
- **Fallback**: Snaps instantly if GSAP/Flip plugin is uninitialized, reduced motion is active, or during window resize.

### 3. CSS Nav Slider (`#navSlider`)
- **Behavior**: A 2px accent bar that tracks the active navigation item using CSS `transform: translateX(...)` and `width`.
- **Initialization**: Suppressed on initial boot via temporary `.no-transition` CSS class to avoid slide-in flashes from (0,0).

---

## Responsive Breakpoints & Hierarchy

| Viewport Width | Navigation Adaptation |
|---|---|
| **> 1024px** | Full horizontal capsule nav + active sidebar navigation. |
| **<= 1024px** | Sidebar navigation collapses into mobile bottom tab bar. |
| **<= 768px** | Text labels hide; icons and active indicators remain visible. |
| **<= 480px** | Index numbers (01, 02...) hide to prevent capsule overflow. |

---

## Verification & Quality Checklist

- [ ] Nav corner brackets hide completely in Sun theme (`[data-theme="sun"] .nav-corner-group { display: none; }`).
- [ ] Nav brand mark assets exist at `brand/nav-mark-{64,128,192}.webp`.
- [ ] Rapid panel switching does not cause GSAP Flip bracket misalignment.
