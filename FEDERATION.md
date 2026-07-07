# monozen-skills — Federation Map

> How 42 skills are federated across 6 filesystem directories,
> and how CLI consumers resolve them.

---

## Overview

The federation is a **write-once, read-from-anywhere** model. Skills are authored canonically in this repo (`skills/`), then distributed to each CLI's native skill directory via `npx skills add`. Each consumer reads from its own path — no symlinks, no shared state.

![Federation mindmap](monozen-skills-federation.svg)

---

## Directory Map

### `~/.agents/skills/` — 28 skills

The primary skill directory. Installed by `npx skills add` and consumed by Claude Code, Cursor, CodeBuff, and Crush/kilo.

```
asta-skill              # Semantic Scholar corpus queries
bangumi-frames          # Anime frame extraction from Bilibili
creating-mermaid-diagrams  # Mermaid diagram generation + Kroki export
drawio-skill            # draw.io diagram XML + export
excalidraw              # Excalidraw diagram generation + export
gsap-core               # GSAP .to(), .from(), easing, matchMedia
gsap-frameworks         # GSAP in Vue, Svelte
gsap-performance        # GSAP optimization, will-change, batching
gsap-plugins            # GSAP DrawSVG, Flip, ScrollTrigger, SplitText
gsap-react              # GSAP in React, useGSAP hook
gsap-scrolltrigger      # GSAP ScrollTrigger plugin
gsap-timeline           # GSAP timeline sequencing
gsap-utils              # GSAP utils: clamp, mapRange, random
improve                 # Read-only codebase audit + improvement plans
journal-abbrev          # Journal name abbreviation lookup
monozen-architecture    # Monozen 5-panel SPA architecture
monozen-nav             # Monozen nav bar, corner brackets, brand
monozen-themes          # Monozen Sun/Moon dual-theme identity
monozen-webgl           # Monozen WebGL2 shader pipeline
paper-fetch             # Paper PDF download via Unpaywall → Sci-Hub
pi-cli-runtime          # Pi-companion runtime contract
pi-prompting            # Pi prompt composition guidance
pi-result-handling      # Pi output presentation
plantuml-skill          # PlantUML diagram generation + Kroki export
semanticscholar-skill   # Semantic Scholar API search
target-prioritization   # Drug target prioritization from gene lists
tldraw-skill            # tldraw diagram JSON + export
video-podcast-maker     # Automated narrated video production
```

### `~/.commandcode/skills/` — 4 skills

Command Code's skill directory. A subset of monozen skills that are core to the portfolio project.

```
monozen-architecture
monozen-nav
monozen-themes
monozen-webgl
```

### `~/.gemini/config/skills/` — 11 skills

Gemini's native skill directory. Primarily design and brand skills.

```
banner-design               # Banner/hero section design
brand                       # Brand identity system
claude-mem                  # Claude memory management
design                      # General design partner skill
design-system               # Design system construction
make-interfaces-feel-better # Interface polish & delight
ponytail                    # Specialized design skill
slides                      # Slide deck design
superpowers                 # Enhanced design capabilities
ui-styling                  # UI style guidance
ui-ux-pro-max               # Comprehensive UI/UX skill
```

### Gemini Plugin Directories — 2 locations

Installed via Gemini's plugin system. These skills are loaded through plugin-specific paths.

**`~/.gemini/config/plugins/modern-web-guidance-plugin/skills/`** — 2 skills

```
chrome-extensions       # Chrome extension development
modern-web-guidance     # Modern web development patterns
```

**`~/.gemini/config/plugins/ui-ux-pro-max-skill/.claude/skills/`** — 7 skills

```
banner-design
brand
design
design-system
slides
ui-styling
ui-ux-pro-max
```

### Command Code Built-in Skills — 2 skills

Shipped with the `command-code` npm package at `~/.npm-global/lib/node_modules/command-code/skills/`.

```
agent-browser   # Browser automation for AI agents
design          # Design partner for frontend interfaces
```

---

## Consumer → Path Resolution

| CLI | Resolves skills from | Shell substrate | Entry point |
|---|---|---|---|
| **Claude Code** | `~/.agents/skills/` + `AGENTS.md` at project root | herdr (panes, sessions) | Project-level AGENTS.md lists monozen-skills |
| **Cursor** | `~/.agents/skills/` + `AGENTS.md` + `.cursorrules` | herdr | AGENTS.md at project root |
| **CodeBuff** | `~/.agents/skills/` + `AGENTS.md` | herdr | Project-level AGENTS.md |
| **Crush (kilo)** | `kilo.jsonc skills.paths[*]` — 5 of 6 directories + `AGENTS.md` | herdr | Reads federation paths directly from config |
| **Gemini** | `~/.gemini/config/skills/` + plugin skill dirs | herdr | Gemini UI config / plugin settings |

---

## Load Order

Crush/kilo loads skills in the order defined by `kilo.jsonc > skills.paths`. When multiple directories contain skills with the same name, the **first path wins**.

```jsonc
// The order in ~/.config/kilo/kilo.jsonc determines priority
"skills": {
  "paths": [
    "~/.agents/skills",              // 1st priority (28 skills)
    "~/.commandcode/skills",         // 2nd priority (4 skills)
    "~/.gemini/config/skills",       // 3rd priority (11 skills)
    "~/.gemini/config/plugins/modern-web-guidance-plugin/skills",   // 4th
    "~/.gemini/config/plugins/ui-ux-pro-max-skill/.claude/skills"   // 5th
  ]
}
```

---

## Skill Canonicalization

This repo is the **source of truth**. When skills overlap between directories (e.g., `design` appears in 3 places), the canonical version lives in this repo under `skills/design/` and should be distributed to all consumers that need it.

The `install.sh` script handles deduplication:
- Skills unique to a consumer → installed only to that consumer's path
- Shared skills → installed to all matching consumer paths
- Overrides → the `consumers` field in frontmatter explicitly lists targets

---

## Adding to the Federation

To add a new skill that appears in a specific consumer's directory:

1. Create the skill file in `skills/<domain>/`
2. Set `consumers` in frontmatter (e.g., `consumers: [crush, claude-code]`)
3. Run `scripts/manifest.sh` to update `index.json`
4. The skill will be distributed to matching consumer paths on next `npx skills add`
