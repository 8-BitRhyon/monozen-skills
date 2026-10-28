# Annotation Harness

Click-to-comment on a live page. The overlay captures DOM context, the collector stores JSONL, the agent reads pending items and resolves them.

## 1. Start The Collector

From the project root:

```bash
node ~/.agents/skills/design-loop/scripts/collector.mjs --file .design/annotations.jsonl
```

It binds `127.0.0.1:4748` and writes one JSON object per line. Add `.design/` to `.gitignore`.

## 2. Inject The Overlay

Open the page, open the DevTools console, and run:

```js
const s = document.createElement("script");
s.src = "http://127.0.0.1:4748/overlay.js";
document.head.append(s);
```

Or add a dev-only script tag:

```html
<script src="http://127.0.0.1:4748/overlay.js"></script>
```

CSP: allow `http://127.0.0.1:4748` in `script-src` and `connect-src` for dev only.

Toggle inspect mode with `Alt+Shift+A`. Click an element, write the comment, and save with `Cmd/Ctrl+Enter`.

## 3. Prove It On The Fixture

```bash
cd ~/.agents/skills/design-loop/templates
python3 -m http.server 8788
```

Open `http://localhost:8788/fixture.html`. The fixture has deliberate flaws: low-contrast CTA, uneven cards, cramped nav at 390 px.

## 4. Agent Loop

Read pending:

```bash
curl -s "http://127.0.0.1:4748/annotations?status=pending" | jq
```

Fix one severity class, verify the selector and the visual change, then resolve:

```bash
curl -s -X PATCH "http://127.0.0.1:4748/annotations/<id>" \
  -H "content-type: application/json" \
  -d '{"status":"resolved"}'
```

Never batch-resolve without checking that the selector still resolves and the layout changed.

## Schema

| Field | Meaning |
|---|---|
| `id` | `ann_<time>_<random>`, assigned by the collector |
| `url` / `route` | Full URL and pathname at capture time |
| `selector` | Primary CSS selector |
| `selectorChain` | Fallbacks with stability: testid, id, css, text, role |
| `boundingBox` | Viewport box, viewport size, DPR |
| `textSnippet` | Visible text, 200 chars |
| `computedStyles` | Layout, type, color, spacing subset |
| `comment` | The human note |
| `severity` | `blocking`, `important`, `suggestion` |
| `status` | `pending`, `resolved`, `dismissed` |
| `timestamp` | ISO capture time |
| `source` | Optional component file and line |

```json
{
  "schemaVersion": "1.0",
  "id": "ann_m1x2_9f3a1c",
  "url": "http://localhost:8788/fixture.html",
  "route": "/fixture.html",
  "selector": "[data-testid=\"hero-cta\"]",
  "selectorChain": [{ "type": "testid", "value": "[data-testid=\"hero-cta\"]", "stability": 0.95 }],
  "boundingBox": { "x": 120, "y": 480, "width": 108, "height": 40, "viewportWidth": 1440, "viewportHeight": 900, "dpr": 2 },
  "textSnippet": "Start free",
  "computedStyles": { "display": "inline-flex", "backgroundColor": "rgb(185, 201, 194)" },
  "comment": "Contrast is too low. Use the solid accent and keep the label.",
  "severity": "blocking",
  "status": "pending",
  "timestamp": "2026-10-28T10:12:03.114Z",
  "source": null
}
```

## React Adapter: Agentation

Agentation is optional. It returns React component names and `sourceFile:line`, which this overlay cannot. Requirements: React 18+, desktop, dev only. License: PolyForm Shield 1.0.0, source-available for internal use; verify before redistributing.

1. `npm i -D agentation`
2. Render it in dev only. Its MCP endpoint defaults to port `4747`, so it does not collide with this collector on `4748`.
3. Run `npx -y agentation-mcp server`.
4. Use its watch tool to receive annotations.

Keep this collector's JSONL as the record of decisions. Mirror each Agentation annotation into it.

## Limits

- Same-origin iframes and closed shadow roots are not traversed. Annotate the host element.
- The primary selector prefers `data-testid`, then `data-annotate`, then `id`, then a CSS path. Add `data-annotate` to unstable elements.
- The collector has no auth and allows any origin. Bind it to localhost and never deploy it.
- The overlay is a dev tool. It must not ship in production.
