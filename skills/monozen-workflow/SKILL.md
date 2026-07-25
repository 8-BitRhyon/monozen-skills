# Monozen Engineering Workflow Skill

> **Scope:** This skill captures the iterative, evidence-driven development workflow used for the Monozen dual-theme portfolio (Moon/Sun). It encodes the patterns, tools, and discipline established across sessions — from TDD Prove-It cycles to Chrome DevTools verification, WebGL/GSAP performance guardrails, and Cloudflare Pages deployment.

---

## Workflow Philosophy

**Gene-etic (evolutionary) development:** Each change is a mutation tested against a fitness function (tests, visual verification, performance metrics). Surviving mutations ship; failing ones revert. No "big bang" rewrites — only incremental, verifiable steps.

**Core loop:**
```
1. Observe → 2. Hypothesize → 3. TDD Prove-It (fail first) → 4. Implement minimal fix → 5. Verify (tests + Chrome DevTools + deploy preview) → 6. Document in AGENTS.md
```

---

## 1. TDD Prove-It Pattern (Non-Negotiable)

**Rule:** Never implement a fix without a failing test first. The test encodes the expected behavior; the fix makes it green.

**Template:**
```javascript
// test/feature.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature: <what>', () => {
  it('should <expected behavior> — Prove-It: fails against old code', () => {
    // Arrange: set up pre-fix state
    // Act: trigger the behavior
    // Assert: expect the FIXED behavior (will fail before fix)
  })
})
```

**Applied to:**
- Globe ResizeObserver (`test/globe.test.js` — 5 structural tests)
- Font preload (`test/boot.test.js` — 4 font-load assertions)
- Theme edge cases (`test/theme-edge-cases.test.js` — 6 lifecycle gap docs)

**Discipline:** If a test passes against old code, the test is wrong — rewrite it to fail.

---

## 2. Chrome DevTools Verification (Mandatory)

**Rule:** Tests prove logic; Chrome DevTools proves runtime reality. Always verify in browser.

**Tools:** `chrome-devtools-axi` CLI for automation:
```bash
npx -y chrome-devtools-axi snapshot --url https://rhyon.dev --selector '#threeGlobeContainer'
npx -y chrome-devtools-axi evaluate --url https://rhyon.dev --expression "document.querySelector('#threeGlobeContainer')._resizeObserver"
```

**Checklist per deploy:**
- [ ] Globe `_resizeObserver` exists, `_handleResize` defined
- [ ] Font preload: `document.fonts.ready` resolves before paint
- [ ] Theme toggle guard: click during boot → no-op
- [ ] Reduced-motion: `prefers-reduced-motion: reduce` skips picker GSAP
- [ ] No console errors, no WebGL context lost
- [ ] LCP/INP/CLS within budget (web-perf skill)

---

## 3. WebGL/GSAP Performance Guardrails

### WebGL
- **50% downsample:** All shader canvases render at `Math.ceil(clientWidth * 0.5) × Math.ceil(clientHeight * 0.5)`. CSS stretches to fill.
- **DPR cap:** `gl.uniform1f(u.pixelRatio, 1.0)` during boot — prevents Retina 2x penalty.
- **Merged rAF:** Concurrent shaders (boot-bg + hal-eye) share one rAF loop throttled to 30fps (`__bootFrame % 2 !== 1`).
- **No pixel reads:** `preserveDrawingBuffer: false` default — verify via screenshot, not `readPixels`/`drawImage`.
- **Cleanup:** `destroy()` cancels rAF, removes visibility listeners, clears intervals, disconnects observers.

### GSAP
- **Plugin registry:** Only `ScrollTrigger, DrawSVGPlugin, Flip` registered in `shared.js`. Add to `pluginNames` before use (e.g., SplitText for Sun hero).
- **Reduced-motion gate:** `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` via `getSunMM()`.
- **Moon never calls GSAP:** Moon = event-driven (CSS/2D canvas only). Sun = scroll-driven (GSAP heavy).
- **Transform ownership:** Never animate `transform` via CSS on elements GSAP positions (`x/y/scale/rotation`). Use inner child for decorative rotation.

---

## 4. Theme Lifecycle Discipline

**Architecture:** `data-theme` on `<html>`. Toggle dispatches `theme-changed` CustomEvent.

**Per-theme entry points:**
```javascript
window.__moonInit()    // Moon: starts cursor, globe, glyph matrix, boot-bg, hal-eye
window.__moonDestroy() // Moon: cancels rAF, disconnects observers, clears intervals
window.__sunInit()     // Sun: starts drawer, shaders, ScrollTriggers, pen cursor
window.__sunDestroy()  // Sun: cancels rAF, kills ScrollTriggers, clears intervals
```

**Boot sequence:**
1. `main()` → font preload (both paths) → `initSplitScreen()` or return-visit warp
2. `selectTheme()` → destroys outgoing theme, sets `data-theme`, calls incoming `__init()`
3. `finishBoot()` → kills all WebGL, adds `fonts-ready`, dispatches `theme-changed`
4. `__bootFinished = true` — only THEN theme toggle enabled

**Guardrails:**
- Theme toggle click: `if (!window.__bootFinished) return;`
- `selectTheme()` has `hasCommitted/selecting` guard preventing rapid re-selection
- Destroy MUST clean up everything init created (rAF, observers, intervals, listeners)

---

## 5. File Structure Conventions

```
Website/
├── assets/
│   ├── js/
│   │   ├── moon/           # Moon-only (stable, don't modify)
│   │   ├── sun/            # Sun-only (TARGET — currently flat sun-*.js)
│   │   ├── shared/         # Both themes (caution)
│   │   └── boot.js         # Entry point, theme toggle, split-screen
│   ├── css/
│   │   ├── main.css        # Shared (linked FIRST)
│   │   ├── moon.css        # [data-theme="moon"] prefixed
│   │   └── sun.css         # [data-theme="sun"] prefixed
│   └── fonts/              # Self-hosted WOFF2 only
├── panels/                 # TARGET: one HTML per panel (currently inlined)
├── test/                   # vitest — 182 tests, 13 files
├── index.html              # CSS order: tailwind → main → moon → sun
├── _headers                # CSP, HSTS, COOP, CORP (base64 hashes!)
├── _redirects              # /*.geojson → 200
└── package.json            # vitest, wrangler, no build step
```

**CSS load order is critical:** `main.css` before `moon.css` — same specificity (0-1-0), `:root` wins otherwise.

---

## 6. Deployment & CI/CD

**Platform:** Cloudflare Pages (Free), project `monozen`, domain `rhyon.dev`.

**Deploy:**
```bash
# From Website/ directory
npx wrangler pages deploy . --project-name monozen
```

**CI/CD:** `.github/workflows/deploy.yml` — push to `main` triggers vitest → wrangler deploy.
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- CSP hashes in `_headers` AND `<meta>` — both must sync (base64, not hex)

**Verification:**
```bash
curl -I https://rhyon.dev          # 200, headers present
curl https://rhyon.dev | grep _resizeObserver  # deploy confirmed
```

---

## 7. Known Pitfalls (Memorize)

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Named function expression vs declaration | `ReferenceError: render not defined` | Use `window.__fnName` reference |
| MutationObserver accumulation | Double-init kills first observers | Track in array, disconnect AFTER re-init guard |
| Anonymous `addEventListener` | Can't remove listener | Named function ref + `removeEventListener` in destroy |
| CSS `transform` animation vs GSAP | Element pinned at 0,0 | Move CSS animation to inner child |
| `preserveDrawingBuffer: false` | `readPixels` returns transparent | Use `chrome-devtools-axi screenshot` |
| `container.style.position = 'relative'` | Collapses `absolute; inset:0` caller | Never touch caller's position; position wrapper instead |
| `ResizeObserver` on `window` only | Globe squished until scroll | Observe `this.container` directly |
| Font preload only on return visit | Split-screen FOUT | Preload before `if (isFirst && split)` |
| Split-screen GSAP ignores reduced-motion | Motion on `prefers-reduced-motion: reduce` | Gate with `!window.__reduceMotion` |

---

## 8. Skill Invocation Triggers

Load this skill when:
- Working on Monozen portfolio (`Website/` directory)
- Debugging theme transitions, WebGL shaders, GSAP animations
- Adding/fixing Moon/Sun lifecycle code
- Writing vitest tests for DOM/Canvas/WebGL logic
- Deploying to Cloudflare Pages
- Updating AGENTS.md / design.md after architecture changes

---

## 9. Quick Reference Commands

```bash
# Test
npm test                    # vitest run (182 tests)
npm run test:watch          # vitest watch

# DevTools verification
npx -y chrome-devtools-axi snapshot --url https://rhyon.dev --selector '#threeGlobeContainer'
npx -y chrome-devtools-axi evaluate --url https://rhyon.dev --expression "document.fonts.ready.then(() => 'fonts ready')"

# Deploy
cd Website && npx wrangler pages deploy . --project-name monozen

# CSP hash regeneration (when inline scripts change)
python3 -c "import hashlib, base64; print('sha256-' + base64.b64encode(hashlib.sha256(b'<script>...</script>').digest()).decode())"

# GitHub ops
npx -y gh-axi workflow list
npx -y gh-axi run list --workflow deploy.yml
```

---

## 10. Evolution Log

| Version | Change | Trigger |
|---------|--------|---------|
| v3.30 | Globe ResizeObserver, font preload reorder, theme toggle guard, reduced-motion guard | Globe squish + Story panel FOUT |
| v3.29 | HalftoneDots portrait, 3D grid hero, 8s countdown | Visual identity audit |
| v3.23 | Sun drawer navigation (folder metaphor) | Sun nav removal |
| v3.18 | Ask Terminal LLM (Moon only, ISO 42001/OWASP) | Governance-grade AI |
| v3.12 | Sun serif-editorial fonts promoted (Fraunces/Newsreader/Archivo/Departure Mono) | Design.md §2 TARGET → live |

---

**This skill is the Monozen genome.** When in doubt, run the loop: Observe → Test → Fix → Verify → Document.