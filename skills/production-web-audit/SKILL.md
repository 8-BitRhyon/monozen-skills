---
name: production-web-audit
description: "Universal pre-deployment and release audit protocol for web applications: covers security headers & CSP, event/memory leak prevention, accessibility & reduced-motion compliance, Service Worker cache invalidation, automated test gates, and Chrome DevTools runtime validation. Use before deploying any web application to production."
---

# Production Web Audit Skill

## Overview

A universal, multi-axis audit protocol for web applications before shipping to production. Works across any framework or stack (React, Next.js, Vue, Svelte, Vite, Vanilla JS, Node).

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

---

## Universal Verification Protocol

Execute in 3 sequential steps:

1. **Automated test gate:** `npm test` - all suites pass.
2. **Production build:** `npm run build` - compilation and bundling zero errors.
3. **Runtime audit via `chrome-devtools-axi`:**
```bash
python3 -m http.server 8788 --directory . &
npx -y chrome-devtools-axi open http://localhost:8788
npx -y chrome-devtools-axi console     # zero console errors
npx -y chrome-devtools-axi eval "() => document.title"
npx -y chrome-devtools-axi stop
```
*Requirement: zero console errors, clean network traces, verified DOM state.*

## Invocation

Load when:
- Deploying any web application to production
- User asks "audit", "pre-deploy", "is this safe to ship", "release"
- After any change touching CSP, listeners, Service Worker, or animation
