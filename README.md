# monozen-skills

**Centralized agent skill registry + workstation sandbox definition for the Monozen system.**

Agent skills are runnable protocol modules that agent CLIs (Claude Code, Cursor, CodeBuff, Kilo, Gemini) use to execute tasks with high precision, zero hallucination, and strict adherence to your engineering preferences. This repository is the canonical source: publish once, `npx skills add` everywhere.

```
github.com/8-BitRhyon/monozen-skills
```

---

## The Monozen Agentic Philosophy

Monozen operates on a **dual-persona, evidence-driven engineering methodology**:

- **Moon (The Systemizer)**: Cold precision, deterministic diagnostic logs, reticle, automated unit test gates (`npm test`), zero-hallucination verification.
- **Sun (The Shaper)**: Technical drafting table, visual UI/UX polish, real-browser DevTools validation (`chrome-devtools-axi`), scrollytelling narratives.
- **Evidence Over Hope**: "Seems right is not done." Every change is governed by TDD prove-it cycles, build verification, and real-browser DevTools runtime inspections.

---

## Canonical Skills Showcase (12 Active Skills)

| Domain | Skill | Invocation | Description |
|---|---|---|---|
| **Workflow** | `agentic-loop` | `/agentic-loop` | Universal observe -> plan -> act -> verify autonomous execution cycle |
| **Workflow** | `monozen-workflow` | `/monozen-workflow` | Portfolio TDD prove-it + DevTools verification protocol |
| **Workflow** | `task-decomposition` | `/task-decomposition` | Breaks complex engineering requests into atomic, testable units |
| **Workflow** | `context-engineering` | `/context-engineering` | Optimizes context window setup, token budget, and memory across sessions |
| **Workflow** | `prompt-engineering-loop` | `/prompt-engineering-loop` | 6-step iterative prompt refinement & adversarial pressure testing |
| **Workflow** | `skill-authoring` | `/skill-authoring` | Meta-skill for authoring clean, runnable agent skill modules |
| **Audit** | `monozen-audit` | `/monozen-audit` | Monozen portfolio multi-axis QA & WebGL memory audit |
| **Audit** | `production-web-audit` | `/production-web-audit` | Universal pre-deployment security, performance, & CSP audit |
| **Architecture** | `monozen-architecture` | `/monozen-architecture` | 5-panel SPA architecture & theme decoupling contracts |
| **Architecture** | `monozen-themes` | `/monozen-themes` | Sun/Moon design tokens, typography, and visual identity |
| **Architecture** | `monozen-webgl` | `/monozen-webgl` | WebGL2 50% downsample pipeline & shader context management |
| **Architecture** | `monozen-nav` | `/monozen-nav` | Nav capsule, corner bracket GSAP Flip, and brand crossfade |

---

## The 5-Layer Sandbox Architecture

This repository formalizes the 5-layer sandbox inherited by every workspace in your environment:

```
Layer 0 - Shell Substrate (Ghostty -> tmux -> herdr)
  └── herdr manages persistent panes, tabs, and session state

Layer 1 - Directory Shortcut (workon)
  └── Lightweight ~/.zshrc helper resolving Projects/{name}

Layer 2 - Configuration Gate (kilo.jsonc)
  └── Central sandbox config: permissions, skill paths, model delegation

Layer 3 - Skills Federation (skills-lock.json)
  └── 12 canonical skills + 34 federated plugins across 6 directories

Layer 4 - Distribution (npx skills add)
  └── Distributes canonical skills to CLI-native directories
```

For full details on multiplexer stack & terminal dotfiles, see [WORKSTATION.md](WORKSTATION.md).  
For the complete 6-directory federation breakdown, see [FEDERATION.md](FEDERATION.md).

---

## Directory Structure

```
monozen-skills/
├── README.md                  # System overview & skill showcase
├── FEDERATION.md              # 6-directory federation breakdown
├── WORKSTATION.md             # Terminal multiplexer stack (Ghostty -> tmux -> herdr)
├── AGENTS.md                  # Canonical agent instructions & engineering rules
├── package.json               # Manifest & validation scripts
├── skills-lock.json           # Authoritative registry manifest
├── dotfiles/                  # Terminal configuration templates
│   ├── zshrc.template
│   ├── tmux.conf
│   ├── gitconfig
│   ├── gitignore_global
│   ├── aerospace.toml
│   └── lazygit/
├── templates/
│   └── AGENTS.md              # Seed AGENTS.md template for new projects
├── scripts/
│   ├── setup.sh               # Local sandbox bootstrap script
│   ├── manifest.sh            # Auto-generates skills-lock.json
│   └── validate.sh            # Lints skills for frontmatter & zero em dashes
└── skills/                    # ★ CANONICAL SKILL MODULES
    ├── agentic-loop/
    ├── context-engineering/
    ├── monozen-architecture/
    ├── monozen-audit/
    ├── monozen-nav/
    ├── monozen-themes/
    ├── monozen-webgl/
    ├── monozen-workflow/
    ├── production-web-audit/
    ├── prompt-engineering-loop/
    ├── skill-authoring/
    └── task-decomposition/
```

---

## Installation & Usage

### Installing to any Agent CLI

```bash
npx skills add github.com/8-BitRhyon/monozen-skills
```

### Validating & Updating Manifest

```bash
# Validate frontmatter and zero-em-dash rule across all skills
npm run validate

# Regenerate skills-lock.json manifest
npm run manifest
```

---

## License

MIT - Feel free to adapt these agent skills and sandbox architecture for your own workspace.
