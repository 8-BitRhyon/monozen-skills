# monozen-skills

> **"What if your engineering preferences were executable code instead of tribal knowledge?"**

`monozen-skills` is the canonical registry of **executable agent skill protocols** and workstation sandbox definitions for the Monozen engineering system. Publish once, distribute to any agent CLI (`Claude Code`, `Cursor`, `CodeBuff`, `Kilo`, `Gemini`).

```bash
npx skills add github.com/8-BitRhyon/monozen-skills
```

---

## Engineering Philosophy & Core Identity

Monozen operates on **cognitive persona isolation** and **epistemic discipline**:

- **Moon (The Systemizer)**: Cold diagnostic precision, reticle HUDs, WebGL memory safety, unit test gates (`npm test`), and zero-hallucination verification.
- **Sun (The Shaper)**: Technical drafting table, crisp line geometry, real-browser DevTools validation (`chrome-devtools-axi`), and scrollytelling narratives.
- **Evidence Over Hope**: *"Seems right is not done."* Every change is governed by failing TDD prove-it cycles, build verification, and real-browser DevTools inspections.

📖 **Read the full manifesto in [PHILOSOPHY.md](PHILOSOPHY.md).**

---

## Why Executable Skills? (Before & After)

| Scenario | Agent WITHOUT `monozen-workflow` | Agent WITH `monozen-workflow` |
|---|---|---|
| **Debugging CSS Transform Bug** | Spends 45 minutes editing CSS animation keyframes on `#mz-cursor`, repeatedly pinning the reticle to `(0,0)`. | Immediately checks Pitfall #4: *"CSS transform animation overrides GSAP inline transform. Move rotation to inner `<svg>` child."* Fixes in 1 step. |
| **Theme Toggle Refactor** | Adds event listeners without cleanup, leaking rAF render loops and doubling observers on each theme switch. | Executes theme lifecycle contract: calls `__destroy()` before `__init()`, clears rAF, and disconnects observers. |
| **Verifying Runtime Fix** | Assumes the code works because `npm test` passes in Node mock environment. | Executes Chrome DevTools AXI evaluation against live DOM (`chrome-devtools-axi snapshot`) to prove browser reality. |

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

## System Architecture & Federation

```
Layer 0 - Shell Substrate (Ghostty -> tmux -> herdr)
  └── Managed terminal panes, tabs, and session state

Layer 1 - Directory Shortcut (workon)
  └── Resolution of project workspaces under Projects/

Layer 2 - Configuration Gate (kilo.jsonc)
  └── Sandbox config: permissions, skill paths, model delegation

Layer 3 - Skills Federation (skills-lock.json)
  └── 12 canonical skills + 34 federated plugins across 6 directories

Layer 4 - Distribution (npx skills add)
  └── Distributes canonical skills to CLI-native directories
```

- 📖 **[FEDERATION.md](FEDERATION.md)**: 6-directory federation breakdown and resolution hierarchy.
- 📖 **[WORKSTATION.md](WORKSTATION.md)**: Terminal multiplexer stack (`Ghostty` -> `tmux` -> `herdr`).

---

## Tooling & Validation

```bash
# Validate frontmatter, zero em dashes, and path portability across all skills
npm run validate

# Regenerate skills-lock.json manifest
npm run manifest
```

---

## License

MIT - Authored by [8-BitRhyon](https://github.com/8-BitRhyon).
