# monozen-skills

> **"What if your engineering preferences were executable code instead of tribal knowledge?"**

`monozen-skills` is the canonical registry of **executable agent skill protocols** for the Monozen engineering system, re-architected around Kun Chen's agentic engineering framework: Pi as harness, Herdr as multiplexer, AXI-style CLI wrappers for tools, and isolated Git worktrees for parallel work. Publish once, distribute to any agent CLI (`Claude Code`, `OpenCode`, `Codex`, `Gemini`, `Pi`).

```bash
npx skills add 8-BitRhyon/monozen-skills
```

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

All 12 skills, federated via `npx skills add 8-BitRhyon/monozen-skills`:

| Skill | Invocation | Role |
|---|---|---|
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
AUTHOR   skills/<name>/SKILL.md (strict YAML frontmatter)
   │
   ▼
GATE     pre-commit hook (scripts/install-hooks.sh), local shift-left:
         validate  -> test -> manifest -> lock-sync diff
   │
   ▼
PR       push feature branch (main is protected) -> open PR
   │
   ▼
CI       .github/workflows/validate.yml
         validate job: validate + test + manifest-sync + SHA-pinned actions
         secrets job:  gitleaks full-history secret scan
   │
   ▼
MERGE    required checks pass -> merge to main
   │
   ▼
SHIP     consumers run `npx skills add 8-BitRhyon/monozen-skills`
         -> skills federated to each CLI's native skill directory
```

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

- **Agent harness**: Pi (`@pi-coding-agent`), plus Claude Code / OpenCode / Codex.
- **Multiplexer**: Herdr (`herdr`, plugins list in WORKSTATION.md).
- **Crew distro**: firstmate (`kunchenguid/firstmate`) - talk to one agent, ship with a crew.
- **Tools**: AXI wrappers (`gh-axi`, `chrome-devtools-axi`, `aws-axi`) - see `axi` skill.
- **Isolation**: Treehouse pooled worktrees + `git-worktree` skill - one per task.

---

## License

MIT. Authored by [8-BitRhyon](https://github.com/8-BitRhyon).