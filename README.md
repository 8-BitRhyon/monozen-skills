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

## Engineering Philosophy & Core Identity

Monozen operates on **epistemic discipline** and **cognitive persona isolation**:

- **Moon (The Systemizer)**: Cold diagnostic precision, WebGL memory safety, unit test gates (`npm test`), and zero-hallucination verification.
- **Sun (The Shaper)**: Technical drafting table, crisp line geometry, real-browser DevTools validation (`chrome-devtools-axi`).
- **Evidence Over Hope**: *"Seems right is not done."* Every change is governed by failing TDD prove-it cycles, build verification, and real-browser DevTools inspections.

📖 **Read the full manifesto in [PHILOSOPHY.md](PHILOSOPHY.md).**
📖 **Read the canonical agent instructions in [AGENTS.md](AGENTS.md).**

---

## Skill Catalog

All 16 skills, federated via `npx skills add 8-BitRhyon/monozen-skills`:

| Skill | Invocation | Role |
|---|---|---|
| `new-project` | `/new-project` | Bootstrap any project: scaffold, AGENTS.md, .gitignore, CI, first commit |
| `test-driven-dev` | `/test-driven-dev` | Universal TDD: red -> green -> refactor -> runtime proof |
| `code-review` | `/code-review` | Five-dimension review (correctness, readability, architecture, security, perf) |
| `pr-workflow` | `/pr-workflow` | Branch -> PR -> CI checks -> review -> merge -> cleanup |
| `agentic-loop` | `/agentic-loop` | Universal observe -> plan -> act -> verify cycle |
| `task-decomposition` | `/task-decomposition` | Breaks complex requests into atomic, testable units |
| `context-engineering` | `/context-engineering` | Optimizes context window, token budget, session memory |
| `prompt-engineering-loop` | `/prompt-engineering-loop` | Lean iterative prompt refinement and adversarial pressure testing |
| `skill-authoring` | `/skill-authoring` | Meta-skill for authoring clean, runnable skill modules |
| `axi` | `/axi` | Design token-efficient AXI CLIs (TOON output) instead of MCP payloads |
| `pi-agent` | `/pi-agent` | Pi runtime config: extensions, settings.json, models.json |
| `herdr` | `/herdr` | Herdr multiplexer: panes, states, captain-and-crew (firstmate) orchestration |
| `git-worktree` | `/git-worktree` | Isolated git worktrees (treehouse pool, pi-worktree), merge back, cleanup |
| `git-workflow` | `/git-workflow` | Commit signing (SSH), branch hygiene, history purge |
| `production-web-audit` | `/production-web-audit` | Universal pre-deployment security, performance, CSP audit |
| `monozen-portfolio` | `/monozen-portfolio` | Consolidated Monozen portfolio contracts (themes, WebGL, nav, audit) |

---

## The Captains-and-Crew Operating Model

The workstation runs one captain agent per task on an isolated Git worktree (pooled via `treehouse`), supervised from a Herdr pane:

1. **One captain.** A single orchestrator (Pi / Claude Code / OpenCode / Codex) owns the task end to end.
2. **Delegation.** Independent units are spawned in isolated worktrees (`treehouse` pool, see `git-worktree` skill) and Herdr panes; never two agents in the same working tree.
3. **Escalation is cheap.** Ask the human for decisions you cannot verify; do the work you can. Auto-fix typos; never change product behavior silently.
4. **Cleanup.** After a subagent finishes, report to the captain and return the worktree to the pool (`treehouse return`). Never leave stale worktrees, leases, or branches.

The full captain-and-crew distro is `firstmate` (see Environment below): talk to one agent, ship with a crew.

---

## How Skills Are Processed

```
IDEA     prompt-engineering-loop -> task-decomposition (units, acceptance criteria)
   │
   ▼
BOOTSTRAP new-project skill: scaffold, AGENTS.md, .gitignore, CI, first commit
   │
   ▼
IMPLEMENT test-driven-dev (red -> green -> refactor) + agentic-loop, one commit per unit
   │
   ▼
REVIEW   code-review skill: 5 dimensions, severity triage, PR review
   │
   ▼
GATE     pre-commit hook (scripts/install-hooks.sh): validate -> test -> manifest -> lock-sync
   │
   ▼
PR       pr-workflow skill: branch -> gh pr create -> CI checks -> merge
   │
   ▼
CI       .github/workflows/validate.yml: validate + test + manifest-sync + SHA-pinned actions
         secrets job: gitleaks full-history secret scan
   │
   ▼
MERGE    required checks pass -> merge -> delete branch -> return worktrees
   │
   ▼
RELEASE  production-web-audit (CSP, memory, a11y, console) - pre-deploy audit protocol; deploy per stack
```

Every stage is a runnable protocol (`skills/<name>/SKILL.md`), universal across languages and stacks.

---

## System Architecture & Federation

Skills flow from canonical authoring in this repo through validation, then are distributed to each CLI's native skill directory via `npx skills add`. No symlinks, no shared state. Each consumer reads from its own path (see FEDERATION.md).

- 📖 **[FEDERATION.md](FEDERATION.md)**: Directory breakdown, resolution hierarchy, and consumer-to-path mapping.
- 📖 **[WORKSTATION.md](WORKSTATION.md)**: Terminal multiplexer stack (`Ghostty` -> `tmux` -> `herdr`).

---

## Validation Pipeline

Every skill in this repo passes through a multi-stage gate before distribution:

```bash
# Strict validation: YAML frontmatter (Ruby Psych), name/folder consistency,
# zero em-dashes, no machine-specific paths, lock integrity (sha256), internal links
npm run validate

# Prove the validator itself: self-tests covering every contract violation
npm test

# Regenerate skills-lock.json manifest (name, description, sha256 content hash)
npm run manifest
```

CI additionally enforces that every GitHub Action in `.github/workflows/` is pinned to a full commit SHA (see [FEDERATION.md](FEDERATION.md#cicd-security-sha-pinned-github-actions)).

The pre-commit hook enforces the same gate locally (shift-left). Install it once:

```bash
bash scripts/install-hooks.sh
```

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