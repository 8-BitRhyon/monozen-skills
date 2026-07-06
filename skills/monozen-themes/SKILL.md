---
name: monozen-themes
description: Monozen dual-theme identity system — Sun (Shaper) vs Moon (Systemizer) personas, design tokens, typography, color system, visual rhyming, motion contract. Use when working on theme-specific CSS, design decisions, or visual identity for the Monozen portfolio.
---

# Monozen Themes

## Core Identity
Two people expressed through one frame, not two color palettes:

- **Moon = Systemizer**: cold precision, diagnostic terminal, reticle, never stops. Dark retro-tech terminal aesthetic.
- **Sun = Shaper**: drafting table, finished technical drawing, the pen, produces then stops. Light neo-grotesque cyberpunk aesthetic.

## Motion Contract
- Motion only when the user just did something, plus one "moment of authorship" per artifact
- Sun animates *because of* the visitor, not *at* them
- GSAP powers both themes but the *verb* differs: Sun **draws**, Moon **decodes**
- `prefers-reduced-motion: reduce` kills all animations, shows static states

## Color Tokens (CSS Variables on `:root`)
- `--bg` / `--fg` / `--accent` / `--muted` / `--border` / `--nav-bg` / `--panel-bg`
- Sun: bg `#f8f8f8`, accent `#e63946`
- Moon: bg `#0a0a0a`, accent `#ff4d5a`

## Typography
- **Sun**: Neutral Face (display), Archia (UI), Inter (body)
- **Moon**: OTF Glusp (hero), Disket Mono (display/UI), Avenue X (body)
- **Both**: JetBrains Mono (mono labels/logs)
- All 6 fonts self-hosted under `fonts/`. Inter + JetBrains Mono via Google Fonts.

## Visual Rhyming
- **Sun accent rule system**: hero bar (80px) > h2 underline (40px) > divider (20px) > sidebar (4px) > card/timeline (2px) > footer. Width = weight.
- **Moon reticle scope system**: concentric circles + compass ticks, custom reticle cursor, corner brackets, snap rings, scan grids, > prompts.

## CSS Decoupling
- `sun.css` — all `[data-theme="sun"]` selectors (285 lines, 65 rules)
- `moon.css` — all `[data-theme="moon"]` selectors (366 lines, 88 rules)
- `main.css` — shared/base only. Zero `[data-theme]` selectors.
- All loaded unconditionally in `<head>`.

## Key Design Principles
- **Color as marginalia**: every color = which drafting tool was in hand. Graphite = working notes, pigment red = sign-offs, cyan = schematics, vellum = ground.
- **No borrowed character images**: use public domain historical figures (Lovelace, Hopper, Lamarr) not anime characters.
- **Motion only on interaction**: scroll/reveal entrance animations removed from Sun. Only pen stroke (moment of authorship), sheet-flip (page-turn), title block tick, and hold interaction.
