# monozen-skills

> **"What if your engineering preferences were executable code instead of tribal knowledge?"**

`monozen-skills` is the canonical registry of **executable agent skill protocols** for the Monozen engineering system, re-architected around Kun Chen's agentic engineering framework: Pi as harness, Herdr as multiplexer, AXI-style CLI wrappers for tools, and isolated Git worktrees for parallel work. Publish once, distribute to any agent CLI (`Claude Code`, `OpenCode`, `Codex`, `Gemini`, `Pi`).

## Quick Install (one command)

From any machine with node + Homebrew (no clone needed):

```bash
curl -fsSL https://raw.githubusercontent.com/8-BitRhyon/monozen-skills/main/scripts/install.sh | bash
```

Variants:

| Command | Installs |
|---|---|
| `... \| bash` | Full workstation: skills, Pi runtime, treehouse, firstmate, herdr plugins |
| `... \| bash -s -- --skills` | Agent skills only (minimal; canonical + AXI wrappers) |
| `... \| bash -s -- --with-prereqs` | Full + Homebrew-install missing prereqs (node/npm/git/herdr as needed) |
| `... \| bash -s -- --dry-run` | Preview every step, change nothing |
| `... \| bash -s -- --pi --treehouse` | Any combination of compartments |

Cloned the repo instead? `bash scripts/install.sh` (alias: `bash scripts/setup.sh`). Compartments: `--skills`, `--pi`, `--treehouse`, `--firstmate`, `--herdr-plugins`. Idempotent: re-run to retry only what failed. Prereqs are checked per compartment: `--skills`/`--pi` need node+npm, `--firstmate` needs git, `--herdr-plugins` needs herdr.

```bash
npx skills add 8-BitRhyon/monozen-skills
```

**After install**: restart your agent session so skills and plugins load. For the load order consumers should follow, see [FEDERATION.md](FEDERATION.md#load-order). If skills never load on Pi, check that `~/.pi/agent/settings.json` still has `skills.paths` and the `pi-herdr` extension after the install.

---

## Engineering Philosophy

Moon (The Systemizer) and Sun (The Shaper) drive the two core disciplines: **evidence over hope** ("seems right is not done") and **cognitive persona isolation**. The full manifesto is in [PHILOSOPHY.md](PHILOSOPHY.md); the canonical agent rules live in [AGENTS.md](AGENTS.md).

---

## Skill Catalog

All skills, federated via `npx skills add 8-BitRhyon/monozen-skills` (catalog + token budget in [skills-lock.json](skills-lock.json)):

| Skill | Role |
|---|---|
| `new-project` | Bootstrap any project: scaffold, AGENTS.md, .gitignore, CI, first commit |
| `test-driven-dev` | Universal TDD: red -> green -> refactor -> runtime proof |
| `code-review` | Five-dimension review (correctness, readability, architecture, security, perf) |
| `pr-workflow` | Branch -> PR -> CI checks -> review -> merge -> cleanup |
| `agentic-loop` | Universal observe -> plan -> act -> verify cycle |
| `task-decomposition` | Breaks complex requests into atomic, testable units |
| `context-engineering` | Optimizes context window, token budget, session memory |
| `prompt-engineering-loop` | Lean iterative prompt refinement and adversarial pressure testing |
| `skill-authoring` | Meta-skill for authoring clean, runnable skill modules |
| `axi` | Design token-efficient AXI CLIs (TOON output) instead of MCP payloads |
| `pi-agent` | Pi runtime config: extensions, settings.json, models.json |
| `herdr` | Herdr multiplexer: panes, states, captain-and-crew (firstmate) orchestration |
| `git-worktree` | Isolated git worktrees (treehouse pool, pi-worktree), merge back, cleanup |
| `git-workflow` | Commit signing (SSH), branch hygiene, history purge |
| `production-web-audit` | Universal pre-deployment security, performance, CSP audit |
| `monozen-portfolio` | Consolidated Monozen portfolio contracts (themes, WebGL, nav, audit) |

Agents match a skill by its `name` and `description` frontmatter; the one-line role above is the catalog's summary, not an invocation command.

---

## Operating Model

One captain agent per task on an isolated git worktree (pooled via `treehouse`), supervised from a herdr pane; independent units go to subagents in their own worktrees, and every worktree returns to the pool when done. The full protocol is the canonical operating model in [AGENTS.md](AGENTS.md#harness-agnostic-operating-model); the captain-and-crew distro is `firstmate` (see Environment below).

## How Skills Are Processed

```
idea -> new-project -> test-driven-dev + agentic-loop -> code-review
     -> pre-commit gate (validate -> test -> smoke -> manifest)
     -> pr-workflow -> CI (validate + secrets) -> merge -> production-web-audit
```

Every stage is a runnable protocol (`skills/<name>/SKILL.md`), universal across languages and stacks.

---

## System Architecture & Federation

Skills flow from canonical authoring in this repo through validation, then are distributed to each CLI's native skill directory via `npx skills add`. No symlinks, no shared state. Each consumer reads from its own path (see FEDERATION.md).

- 📖 **[FEDERATION.md](FEDERATION.md)**: Directory breakdown, resolution hierarchy, and consumer-to-path mapping.
- 📖 **[WORKSTATION.md](WORKSTATION.md)**: Terminal multiplexer stack (`Ghostty` -> `tmux` -> `herdr`).

---

## Validation Pipeline

Every change passes, in order: `npm run validate` (frontmatter, em dashes, machine paths, lock integrity, internal links, FEDERATION counts), `npm test` (self-tests for every contract violation), and `npm run manifest` + lock-sync. Contributors need node (tests) and Ruby/Psych (validator). The pre-commit hook runs the same gate locally (`bash scripts/install-hooks.sh`); CI adds SHA-pinned actions and the gitleaks secrets scan (see [FEDERATION.md](FEDERATION.md#cicd-security-sha-pinned-github-actions)).

---

## Environment

- **Agent harness**: Pi (`@earendil-works/pi-coding-agent`), plus Claude Code / OpenCode / Codex.
- **Multiplexer**: Herdr (`herdr`, plugins list in WORKSTATION.md).
- **Crew distro**: firstmate (`kunchenguid/firstmate`) - talk to one agent, ship with a crew.
- **Tools**: AXI wrappers (`gh-axi`, `chrome-devtools-axi`, `aws-axi`) - see `axi` skill.
- **Isolation**: Treehouse pooled worktrees + `git-worktree` skill - one per task.

---

## License

MIT. Authored by [8-BitRhyon](https://github.com/8-BitRhyon).