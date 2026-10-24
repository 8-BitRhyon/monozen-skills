# Layout Contract Reference

Use this when a change touches full-height sections, CSS flow, canvas or pointer effects, responsive grids, or service worker assets.

## Failure Modes

1. **Short footer**: `min-height` is missing, overridden by a later stylesheet, or measured in the wrong viewport unit. The page bottom still shows the previous section.
2. **Zero-width stage**: A stage moved from absolute to flow inherits `align-items: center` or `width: auto`, so its width collapses. Absolutely positioned hands then anchor around the center and swap sides.
3. **Hover offset**: The spark is stored in stage coordinates, the mouse in container coordinates, and the canvas in client coordinates. The effect appears below the cursor by the stage offset.
4. **Stale assets**: The service worker is cache-first, its install fails on one missing precache URL, and the old CSS or JavaScript stays pinned.
5. **Mobile overflow**: A grid uses `1fr` with min-content children, so a three-column spec bar exceeds a 390px viewport and clips the last control.

## Geometry Checks

Measure after scrolling to the document bottom:

- Section height is greater than or equal to `window.innerHeight`.
- Section top is at or above the viewport top, and bottom is at the viewport bottom.
- Any flow stage spans the intended width, not zero.
- Left and right interactive targets keep their expected order.
- Overlay and triptych bottom stay inside the section.
- No horizontal document overflow.

## Pointer-Space Checks

Name the coordinate system for every value:

| Value | Space |
|---|---|
| `clientX`, `clientY` | Viewport |
| `mouseX`, `mouseY` | Container or footer |
| `sparkX`, `sparkY` | Container for comparisons, stage for drawing |
| Canvas local | Element intrinsic size |

Rules:

- Store the raw client position when a canvas or hit test needs it.
- Convert once. Do not add a stage offset to a value that is already container-relative.
- Keep drawing coordinates separate from comparison coordinates.
- Test the effect centroid against the cursor after the layout settles.

## Service Worker Checks

- Install succeeds with no 404 in the precache list.
- The active cache name changes with the release.
- The changed CSS or JavaScript URL has a version query, or the cache is guaranteed empty.
- A fresh context and a previously cached context both render the new asset.

## Viewport Matrix

At minimum:

- Desktop: `1440x900`
- Tall desktop: `1440x1200`
- Mobile: `390x844`

Add the product's actual breakpoints and any ultrawide breakpoint.

## Playwright Template

Use [layout-contract.spec.js](../templates/layout-contract.spec.js) as the starting point. Adapt the selectors and the expected geometry. Keep the assertions behavior-level.
