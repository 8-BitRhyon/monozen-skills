---
name: monozen-nav
description: Monozen nav bar system — capsule layout, corner brackets (GSAP Flip), brand crossfade on scroll, Moon/Sun gating, responsive breakpoints. Use when modifying the nav bar, corner bracket animation, brand mark transitions, or nav CSS for the Monozen portfolio.
---

# Monozen Nav Bar

## HTML Structure
- `<nav class="nav">` — fixed top-center glassmorphism capsule
- `.nav-inner` — flex container with `position: relative` (anchor for corner brackets)
- `.nav-brand` — link wrapping `.nav-brand-text` (text) + `.nav-brand-mark` (picture element)
- `.nav-links` — internal flex, has `position: relative`
- `.nav-toggles` — theme toggle button + Sun stamp palette

## Brand Crossfade (scroll listener in panel-system.js)
- Default-safe: `.nav-brand-text` (text) fully visible, `.nav-brand-mark` hidden with `pointer-events: none`
- On scroll >32px: `.nav.is-scrolled` toggled
- `.is-scrolled .nav-brand-text` → `opacity: 0`
- `.is-scrolled .nav-brand-mark` → `opacity: 1; transform: scale(1)`
- `prefers-reduced-motion: reduce` disables transition but allows instant snap
- Brand mark assets at `brand/nav-mark-{64,128}.{webp,png}` + `brand/nav-mark-192.png`

## Corner Brackets (`#navCornerGroup`, Moon-only)
- Four SVG L-shapes positioned via CSS transforms (scaleX/scaleY for orientation)
- `[data-theme="sun"] .nav-corner-group { display: none; }`
- `updateNavCorners(id, opts)` in panel-system.js:
  - Reads `offsetLeft`/`offsetTop`/`offsetWidth`/`offsetHeight` of active `.mz-nav-item`
  - Uses `Flip.getState(group)` → `Flip.from(state, { duration: 0.4, ease: 'power3.out' })`
  - Falls back to instant snap if: GSAP/Flip unavailable, reduced motion, or `opts.snap === true`
- Reposition on `theme-changed` and `resize` events (snapped, no Flip)

## Nav Slider (`#navSlider`)
- 2px accent underline tracking active item
- `updateNavSlider(id)` sets `width` + `translateX` via CSS transition
- Initial position suppressed by `.no-transition` class on load

## Responsive Breakpoints
- ≤1024px: sidebar nav hidden, mobile tab bar visible
- ≤768px: nav labels hidden (icons only), brand padding reduced
- ≤480px: nav index numbers hidden

## Moon-Specific Nav
- Corner brackets active (animated via Flip)
- `.mz-glow` filter on active icons
- Snap rings on snap-btn hover

## Sun-Specific Nav
- Stamp palette in nav-toggles (`.stamp-palette`)
- Corner brackets hidden
- MZ glyphs at stroke-width: 1 (vs Moon's 1.25)
