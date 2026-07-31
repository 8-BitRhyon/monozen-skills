# monozen-skills: Federation Map

> How canonical skills are federated across filesystem directories,
> and how CLI consumers resolve them.

---

## Overview

The federation is a **write-once, read-from-anywhere** model. Skills are authored canonically in this repo (`skills/`), validated through a multi-stage pipeline (frontmatter check, security gate, SSH signing), then distributed to each CLI's native skill directory via `npx skills add`. Each consumer reads from its own path. No symlinks, no shared state.

<img src="assets/monozen-skills-federation.svg" alt="Skills Federation Mindmap" width="100%"/>

---

## Directory Map

### `~/.agents/skills/` - 32 skills

The primary skill directory. Installed by `npx skills add` and consumed by Claude Code, Cursor, CodeBuff, and Crush/kilo.

```
asta-skill              # Semantic Scholar corpus queries
bangumi-frames          # Anime frame extraction from Bilibili
chrome-devtools-axi     # AXI-wrapped browser automation (chrome-devtools-mcp)
creating-mermaid-diagrams  # Mermaid diagram generation + Kroki export
drawio-skill            # draw.io diagram XML + export
excalidraw              # Excalidraw diagram generation + export
find-skills             # Agent skill discovery & suggestions
gh-axi                  # AXI-wrapped GitHub CLI (gh)
gsap-core               # GSAP .to(), .from(), easing, matchMedia
gsap-frameworks         # GSAP in Vue, Svelte
gsap-performance        # GSAP optimization, will-change, batching
gsap-plugins            # GSAP DrawSVG, Flip, ScrollTrigger, SplitText
gsap-react              # GSAP in React, useGSAP hook
gsap-scrolltrigger      # GSAP ScrollTrigger plugin
gsap-timeline           # GSAP timeline sequencing
gsap-utils              # GSAP utils: clamp, mapRange, random
herdr                   # herdr terminal multiplexer control skill
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

### `~/.commandcode/skills/`  -  8 skills

Command Code's skill directory. A subset of monozen skills plus AXI tools that are core to workflow.

```
chrome-devtools-axi     # AXI-wrapped browser automation
gh-axi                  # AXI-wrapped GitHub CLI
herdr                   # herdr terminal multiplexer control
monozen-architecture    # Monozen 5-panel SPA architecture
monozen-nav             # Monozen nav bar, corner brackets, brand
monozen-themes          # Monozen Sun/Moon dual-theme identity
monozen-webgl           # Monozen WebGL2 shader pipeline
```

### `~/.gemini/config/skills/`  -  11 skills

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

### Gemini Plugin Directories  -  2 locations

Installed via Gemini's plugin system. These skills are loaded through plugin-specific paths.

**`~/.gemini/config/plugins/modern-web-guidance-plugin/skills/`**  -  2 skills

```
chrome-extensions       # Chrome extension development
modern-web-guidance     # Modern web development patterns
```

**`~/.gemini/config/plugins/ui-ux-pro-max-skill/.claude/skills/`**  -  7 skills

```
banner-design
brand
design
design-system
slides
ui-styling
ui-ux-pro-max
```

### Command Code Built-in Skills  -  2 skills

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
| **Crush (kilo)** | `kilo.jsonc skills.paths[*]`  -  6 directories + `AGENTS.md` | herdr | Reads federation paths directly from config |
| **Command Code** | `~/.commandcode/skills/` + `AGENTS.md` at project root | herdr | Project-level AGENTS.md references tools |
| **Gemini** | `~/.gemini/config/skills/` + plugin skill dirs | herdr | Gemini UI config / plugin settings |

---

## Load Order

Crush/kilo loads skills in the order defined by `kilo.jsonc > skills.paths`. When multiple directories contain skills with the same name, the **first path wins**.

```jsonc
// The order in ~/.config/kilo/kilo.jsonc determines priority
"skills": {
  "paths": [
    "~/.agents/skills",              // 1st priority (32 skills)
    "~/.commandcode/skills",         // 2nd priority (8 skills)
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

---

## CI/CD Security: SHA-Pinned GitHub Actions

Every GitHub Action referenced in `.github/workflows/` **must** be pinned to a full commit SHA, never a mutable version tag (`@v1`, `@latest`, `@main`).

### Why

Version tags are mutable references. The action owner (or anyone who compromises the action repo) can move a tag to point to different code at any time. A workflow using `action@v1` today could silently execute different, potentially malicious code tomorrow with no diff visible in this repo.

A commit SHA is immutable. It always resolves to the exact commit it was reviewed against, so no one can swap in altered code by moving a tag. This closes the tag-reassignment supply chain vector entirely.

This is a general GitHub Actions security practice, not specific to any runtime or language.

### Enforcement

The `zgosalvez/github-actions-ensure-sha-pinned-actions` step in the validate workflow scans every workflow and fails the build if any action uses a version tag instead of a SHA. This check is a release gate: a workflow with an unpinned action does not pass CI.

### Rule of Thumb

When adding any action to a workflow:

1. Resolve the action to a specific release tag (e.g., `v1.321.0`)
2. Get that tag's commit SHA (via `gh api repos/<owner>/<repo>/tags` or the GitHub UI)
3. Pin with `uses: owner/repo@<full-40-char-sha>`
4. Optionally append the human-readable version as a comment, e.g. `# v1.321.0`

### Accepted Pattern

```yaml
- name: Set up Ruby
  uses: ruby/setup-ruby@95ef2b042f9d7a56d8268cba8559e2842e2ad01b # v1.321.0
```
