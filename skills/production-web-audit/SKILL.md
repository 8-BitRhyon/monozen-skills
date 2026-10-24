---
name: production-web-audit
description: "Universal pre-deployment and release audit protocol for web applications: covers security headers & CSP, event/memory leak prevention, accessibility & reduced-motion compliance, Service Worker cache invalidation, layout and pointer-space checks, automated test gates, and Chrome DevTools runtime validation. Use before deploying any web application to production."
---

# Production Web Audit Skill

---

## Audit Axes & Checklist

### 1. Security & Header Hygiene
- [ ] **Content Security Policy (CSP)**: `script-src`, `style-src`, `connect-src`, `img-src`, and `frame-src` allow only necessary and trusted origins.
- [ ] **CSP Synchronization**: If both HTTP response headers (`_headers`, Nginx, Cloudflare, server middleware) and `<meta http-equiv="Content-Security-Policy">` exist, their directives MUST be synchronized.
- [ ] **Security Headers**: Confirm presence of `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or `SAMEORIGIN`), `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- [ ] **Secrets & Credential Audit**: Confirm zero API keys, private tokens, or environment credentials are exposed in client-side code bundles or committed configuration files.

### 2. Resource & Memory Safety
- [ ] **Event Listener Cleanup**: All `addEventListener` calls attached to global targets (`window`, `document`) or dynamic DOM nodes must have corresponding `removeEventListener` cleanup on component unmount or state teardown.
- [ ] **Render Loop & Timer Cleanup**: All `requestAnimationFrame`, `setInterval`, and `setTimeout` loops must be explicitly cancelled when their target container is detached, hidden, or destroyed.
- [ ] **Tab Visibility Handling**: Event handlers on `visibilitychange` must pause animation/render loops when `document.hidden` is true and avoid restarting loops when target DOM elements are missing.
- [ ] **Service Worker Cache Invalidation**: Whenever HTML or static assets change, bump the Service Worker `CACHE_NAME` version string to purge stale caches on client activation.

### 3. Accessibility & Motion Compliance
- [ ] **Reduced Motion**: All JavaScript-driven animations (GSAP, CSS transitions, WebGL canvas renders) must observe `(prefers-reduced-motion: reduce)` media query preferences and bypass non-essential movement.
- [ ] **Keyboard Navigation**: All interactive elements must be keyboard-navigable (`tabindex`, `role`, ARIA attributes) with proper state guards to prevent double-invocation on rapid keypresses.

### 4. Code Hygiene & Deprecation Cleanup
- [ ] **Dead Code Removal**: Remove all obsolete API endpoints, unused third-party scripts, orphaned flags, and vestigial fallback branches.
- [ ] **Clean Console**: Zero uncaught exceptions, unhandled promise rejections, or stray debug loggers in production builds.

### 5. Layout and Pointer Contract
- [ ] **Full-height sections**: At the bottom, the section fills the viewport (`100dvh` or `100svh`), including flow stages and overlays.
- [ ] **Flow geometry**: A stage moved to flow keeps its width, alignment, and gap. Check inherited `align-items`, `flex-wrap`, and `gap`.
- [ ] **Pointer spaces**: Client, container, stage, and canvas coordinates are converted explicitly. Hover effects land under the pointer.
- [ ] **Release assets**: The Service Worker cache and asset query change with the release.

See [layout-contract.md](references/layout-contract.md).

---

## Universal Verification Protocol

1. Run the test gate and production build.
2. Audit the running app with `chrome-devtools-axi`: open, console, eval, stop. Require zero console errors and verified DOM state.
3. Run [layout-contract.md](references/layout-contract.md) for layout or pointer changes.

## Invocation

Load when:
- Deploying any web application to production
- User asks "audit", "pre-deploy", "is this safe to ship", "release"
- After any change touching CSP, listeners, Service Worker, or animation
