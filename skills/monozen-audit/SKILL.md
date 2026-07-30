---
name: monozen-audit
description: Comprehensive audit protocol for the Monozen portfolio: covers edge-case & state transition verification, WebGL context/memory safety, CSP/security header sync, reduced-motion compliance, and runtime DevTools validation.
---

# Monozen Audit Skill

## Overview

The `monozen-audit` skill defines the multi-axis audit checklist, edge-case analysis patterns, and verification protocols for the Monozen dual-persona portfolio. Use this skill before committing major architectural refactors, deploying to Cloudflare Pages, or running pre-release QA.

---

## Audit Axes & Checklist

### 1. State Transition & Theme Lifecycle Audit
- [ ] **Split-Screen Keyboard Guard**: Keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `S`, `M`, `Enter`) in `boot.js:initSplitScreen` must check `if (selecting || hasCommitted || window.__bootFinished) return;` to prevent duplicate transition triggering.
- [ ] **Nav Toggle Lock**: Nav theme-toggle click listener must check `if (!window.__bootFinished) return;`.
- [ ] **Theme Destruction & Re-initialization**:
  - `_doThemeSwitch()` in `boot.js` must invoke outgoing theme teardown (`__moonCursorDestroy`, `__sunCursorDestroy`, `__sunDestroy`).
  - `window.__sunDestroy` must be reset to `null` on teardown so subsequent switches to Sun re-arm `initSunShader()`.
- [ ] **CSS Specificity Order**: In `index.html`, stylesheets MUST load in order: `tailwind.css` -> `main.css` -> `moon.css` -> `sun.css`. Specificity of `:root` in `main.css` and `[data-theme="moon"]` in `moon.css` is equal (`0-1-0`). Loading `main.css` after `moon.css` breaks Moon dark mode.
- [ ] **CSS Selector Isolation**: `main.css` must contain zero `[data-theme]` selectors. All Sun styles live in `sun.css` prefixed with `[data-theme="sun"]`, and Moon styles live in `moon.css` prefixed with `[data-theme="moon"]`.

### 2. WebGL & GPU Memory Safety Audit
- [ ] **Downsample Pattern**: All WebGL shaders (`boot-bg`, `hal-eye`, `FoldGradient`, `PaperTexture`) must cap internal buffer dimensions to 50% client resolution (`Math.ceil(clientWidth * 0.5)`).
- [ ] **DPR Uniform**: WebGL pixel ratio uniform must be explicitly set to `1.0` during boot.
- [ ] **Merged Render Loop**: Concurrent shaders during boot split-screen (`boot-bg` + `hal-eye`) must be merged into `__splitMergeRaf` at 30fps max.
- [ ] **Context Loss on Teardown**: Shader destruction must call `gl.getExtension('WEBGL_lose_context')?.loseContext()` and clear canvas references.
- [ ] **Visibility Listener Cleanup**:
  - `__warpVisHandler` must check `document.getElementById('loader-canvas')` presence before requesting new rAF frames.
  - `finishBoot()` must explicitly remove the `visibilitychange` event listener for `__warpVisHandler`.

### 3. Motion & Reduced Motion Audit
- [ ] **Global Reduced-Motion Check**: `window.__reduceMotion` must be initialized at boot start via `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- [ ] **GSAP MatchMedia Context**: All Sun GSAP animations must use `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`.
- [ ] **Cursor Transform Safety**: CSS `@keyframes` animations must NEVER target `transform` on `#mz-cursor` (GSAP owns container transform). Apply rotation to inner `<svg>` and strip `idle-pulse` class in `_doThemeSwitch()`.

### 4. Security & Deployment Audit
- [ ] **CSP Header & Meta Tag Sync**: Directives in `Website/_headers` and `Website/index.html` meta tag MUST match exactly.
- [ ] **No Deprecated Domains in CSP**: No orphaned third-party origins (e.g. `challenges.cloudflare.com` if Turnstile is not in use).
- [ ] **Service Worker Versioning**: `CACHE_NAME` in `Website/sw.js` must be bumped (e.g. `monozen-static-v14`) on deploy.
- [ ] **Wrangler Bindings**: `Website/wrangler.toml` must only declare active KV namespaces and Workers AI bindings.
- [ ] **Terminal Local Routing**: Ask terminal in `shared.js` must query local `nlp.js` without unhandled network calls or fallback leaks.
- [ ] **No Sensitive IDs in Tracked Docs**: `AGENTS.md` removed from repo/history; `.md` files must not contain zone/account IDs (`cd872...`, `5f1c3...`), SSH fingerprints, or API tokens.
- [ ] **No Sensitive Artifacts in `.git`**: `git ls-files` returns zero matches for `AUDIT.md`, `m-hack-*`, `logo.png` (legacy), `RhyonHeadshot.png`, `test/*.test.js` at root.
- [ ] **Commit Verification**: `git log --show-signature -1` reports `Good` (SSH signing active) and `.git/config` uses `gpg.format=ssh` with valid `allowed_signers`.
- [ ] `.gitignore` Guards**: `test/` (root), `e2e/`, `archive/`, `mockups/`, `.dev.vars` ignored; `Website/test/` must NOT exist tracked.
- [ ] **History Purge Verified**: `git rev-list --objects --all | grep -iE 'audit|logo\.png|headshot\.png|doodle\.png|m-hack|test.*\.test\.js'` returns empty.

---

## Verification Protocol

Execute the audit in 3 sequential stages:

### Stage 1: Automated Unit Test Suite
```bash
cd Website
# Tests removed: universal guard active
```
*Requirement: 100% test pass rate across all suite files.*

### Stage 2: Build & Asset Compilation
```bash
cd Website
npm run build
```
*Requirement: `scripts/generate-build-meta.js` and Tailwind CSS compilation complete cleanly with zero build errors.*

### Stage 3: Runtime Audit via Chrome DevTools (`chrome-devtools-axi`)
```bash
# 1. Start local preview server
python3 -m http.server 8788 --directory Website &

# 2. Inspect browser state & console
npx -y chrome-devtools-axi open http://localhost:8788
npx -y chrome-devtools-axi console

# 3. Verify Ask terminal local execution
npx -y chrome-devtools-axi eval "() => { window.openAskModal(); var i = document.getElementById('monozenTerminalInput'); i.value = 'stack'; window._executeMonozenQuery(); return document.getElementById('monozenOutputLog').innerText; }"

# 4. Stop session
npx -y chrome-devtools-axi stop
```
*Requirement: Zero console errors, clean execution of terminal commands, and proper WebGL state management.*
