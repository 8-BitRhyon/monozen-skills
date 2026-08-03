---
name: monozen-portfolio
description: "Consolidated Monozen portfolio skill: dual-theme (Sun/Moon) lifecycle contracts, 5-panel SPA architecture, CSS specificity load order, WebGL context safety, nav capsule behavior, and pre-deploy audit protocol. Load when working on any file under the Monozen portfolio project."
---

# Monozen Portfolio

Aggregated engineering protocol for the Monozen dual-persona portfolio (Moon Systemizer / Sun Shaper). This skill replaces the former per-domain skills (architecture, themes, nav, webgl, workflow, audit) with one lean contract.

## Architecture Base

- Zero-dependency SPA. `index.html` shell + panels: `focus`, `work`, `projects`, `registry`, `toolchain`.
- Router: `window.switchPanel(panelId)` in `panel-system.js`. Keys `1-5` switch panels; swipe cycles on mobile.
- CSS load order is a hard contract (equal specificity `0-1-0`, later wins):
  `tailwind.css` -> `main.css` -> `moon.css` -> `sun.css`.
  `main.css` holds shared tokens and ZERO `[data-theme]` selectors. All theme overrides are prefixed.

## Theme Lifecycle Contracts

- Every theme exposes `window.__moonInit()` / `window.__moonDestroy()` and `window.__sunInit()` / `window.__sunDestroy()`.
- `_doThemeSwitch()` (boot.js) invokes outgoing `__destroy()` first, resets `__sunDestroy` to `null`, then calls incoming init.
- Toggle guarded by `window.__bootFinished`; rapid re-selection guarded by `selecting || hasCommitted`.
- `data-theme` on `<html>`; `theme-changed` CustomEvent dispatched at `finishBoot()`.
- Sun = GSAP heavy (matchMedia `(prefers-reduced-motion: no-preference)`). Moon = event-driven only.
- Never CSS-animate `transform` on elements GSAP positions; decorate inner SVG children instead.

## WebGL Safety (GPU memory)
- Shader canvases render at 50% client resolution (`Math.ceil(clientWidth * 0.5)`); DPR uniform `1.0`.
- Merge concurrent rAF loops into one `window.__splitMergeRaf` throttled to 30fps.
- Destroy via `gl.getExtension('WEBGL_lose_context')?.loseContext()`; cap context count (browser ~8-16).
- Visibility changes must check target canvas exists before requesting frames.

## Nav / Visual Identity
- Floating glass nav capsule; Moon shows GSAP Flip corner brackets, Sun hides them and flattens to 1px strokes.
- Brand crossfades on scroll > 32px (text -> mark); reduced motion snaps instantly.
- Shift-key token tokens on `:root` (`--bg`, `--fg`, `--accent`, `--muted`, `--border`) per theme.

## Pre-Deploy Audit (script + runtime)
- `security-guard-universal.sh` (this skill dir): universal secret/ID/fingerprint gate. Runs on any repo; portfolio-specific extra checks live in an optional `.guard-policy.sh` hook, not in the script.
- Runtime: `chrome-devtools-axi open http://localhost:8788` then `chrome console` = zero errors; `eval` terminal query path.
- CSP: `_headers` AND `<meta>` directives must match; bump Service Worker `CACHE_NAME` each release.
- Deploy: `npx wrangler pages deploy . --project-name monozen`.

## Known Pitfalls
| Pitfall | Fix |
|---|---|
| Named fn hoisting -> `render not defined` | Use `window.__fnName` refs |
| Observer accumulation on re-init | Track in array, disconnect after re-init guard |
| CSS transform anim vs GSAP | Move rotation to inner child |
| Font FOUT on split-screen | Preload before split-screen branch |
| `preserveDrawingBuffer:false` reads | Verify via screenshot, never readPixels |

## Invocation

Load when:
- Working on any file under the Monozen portfolio project
- User asks about themes, WebGL, nav, or portfolio deploy
- Pre-deploy audit of the portfolio (run `security-guard-universal.sh` first)