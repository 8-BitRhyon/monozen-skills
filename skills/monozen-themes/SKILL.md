---
name: monozen-themes
description: Monozen dual-theme identity system - Sun (Shaper) vs Moon (Systemizer) personas, design token architecture, color as marginalia, typography choices, visual rhyming, and CSS theme decoupling contracts. Use when making visual or theme-level changes.
---

# Monozen Dual-Theme System (Sun vs Moon)

## Philosophy: Cognitive Modes, Not Color Palettes

Monozen (モノゼン) expresses **two engineering mindsets through one structural frame**:

- **Moon (The Systemizer)**: Cold precision, retro-tech diagnostic terminal, target reticle, non-stop monitor. The cognitive state of deep debugging, systemic tracing, and diagnostic analysis.
- **Sun (The Shaper)**: Drafting table, crisp technical drawing, vellum paper, the drafting pen that produces and then rests. The cognitive state of synthesis, architectural drafting, and finished output.

---

## Color as Marginalia

Color in Monozen is never decorative; it carries functional intent like hand-annotated draft notes:

- **Graphite (`#0a0a0a` / `#f8f8f8`)**: Baseline structural ground.
- **Pigment Red (`#e63946` / `#ff4d5a`)**: Sign-offs, critical telemetry, and moments of authorship.
- **Schematic Cyan (`#00f0ff`)**: Structural grid lines and technical alignment guides.
- **Vellum Paper (`#f4f1ea`)**: Warm analog backing ground for Sun theme.

---

## Token Architecture (CSS Variables on `:root`)

| Variable | Moon (Systemizer) | Sun (Shaper) | Role |
|---|---|---|---|
| `--bg` | `#0a0a0a` (Deep Void) | `#f8f8f8` (Drafting Vellum) | Base viewport background |
| `--fg` | `#f0f0f0` (High-contrast) | `#1a1a1a` (Graphite Ink) | Primary text content |
| `--accent` | `#ff4d5a` (Laser Red) | `#e63946` (Sign-off Red) | Action items & authorship marks |
| `--muted` | `#666666` | `#888888` | Telemetry & secondary labels |
| `--border` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` | Structural panel dividers |

---

## Typography Hierarchy & Rationale

| Role | Sun (Shaper) | Moon (Systemizer) | Design Rationale |
|---|---|---|---|
| **Display / Hero** | Neutral Face | OTF Glusp | Sun uses clean neo-grotesque geometry; Moon uses raw monospace display. |
| **UI / Headers** | Archia | Disket Mono | Sun relies on structured technical type; Moon uses terminal grid monospacing. |
| **Body Text** | Inter | Avenue X | High-legibility sans for Sun; tactical editorial font for Moon. |
| **Telemetry / Code** | JetBrains Mono | JetBrains Mono | Unified monospace engine for logs, metrics, and terminal output. |

*Self-hosted under `Website/assets/fonts/` for zero third-party render blocking.*

---

## Visual Rhyming Scale

Monozen enforces strict proportional visual scales across both themes:

### 1. Sun Accent Width Rule
- **Hero Bar**: 80px width
- **Section Heading (`h2`)**: 40px underline
- **Panel Divider**: 20px marker
- **Sidebar Indicator**: 4px stroke
- **Timeline / Card Border**: 2px hairline

### 2. Moon Reticle Hierarchy
- **Primary Target Cursor**: Concentric circles + compass ticks.
- **Panel Corners**: L-shaped corner brackets.
- **Telemetry Prompt**: `>` terminal prompt cursor.

---

## CSS Decoupling Contract

1. **`main.css`**: Contains ONLY shared resets, CSS grid/flex layouts, and unprefixed tokens. MUST contain zero `[data-theme]` selectors.
2. **`moon.css`**: All Moon theme overrides MUST be prefixed with `[data-theme="moon"]`.
3. **`sun.css`**: All Sun theme overrides MUST be prefixed with `[data-theme="sun"]`.
4. **HTML Linking Order**: `main.css` MUST be linked BEFORE `moon.css` and `sun.css` to ensure correct CSS cascade specificity (`0-1-0`).
