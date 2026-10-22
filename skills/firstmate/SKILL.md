---
name: firstmate
description: "Captain-and-crew orchestration distro protocol. Governs the hierarchy between the human Captain, First Mate (lead orchestrator), persistent Second Mates (department managers), and disposable Crewmates (task executors). Covers session lifecycle (/ahoy, /bearings), Definition of Done (ship-landing), and stall recovery. Load when coordinating multi-agent fleets or supervising parallel crewmates."
---

# firstmate: Captain-and-Crew Orchestration

> **Scope:** The operational protocol of the Firstmate agent distro (`kunchenguid/firstmate`). Replaces chaotic multi-tab babysitting with a disciplined nautical hierarchy: one human Captain interacts with a First Mate orchestrator, which supervises autonomous workers in isolated environments.

## The Hierarchy

1. **The Captain (Human Developer)**:
   - Sets high-level project goals and technical direction.
   - Holds exclusive authority over product scope changes and final production deployments.
   - Responds to genuine decision escalations surfaced by the First Mate.
2. **The First Mate (Lead Orchestrator Agent)**:
   - Sits at the helm in the primary session pane.
   - Decomposes goals into atomic, testable work units (see `task-decomposition`).
   - Dispatches workers into isolated pooled worktrees (via `treehouse`) and multiplexer panes (via `herdr`).
   - Synthesizes diffs, monitors progress, and handles stall recovery.
3. **Second Mates (Persistent Sub-Orchestrators)**:
   - Optional persistent department leads assigned to large submodules or remote SSH nodes.
   - Run independently from their own isolated firstmate home environments.
4. **Crewmates (Disposable Task Workers)**:
   - Short-lived worker agents running a single `agentic-loop` per task.
   - Live exclusively inside isolated `treehouse` worktrees.
   - Never write to a shared branch; report finished diffs and verification evidence to the First Mate.

## Operational Lifecycle Protocols

### 1. Taking the Helm: `/bearings`
When starting a cold session or taking command of a repository:
- Discover project layout, active toolchains, dependency manifests, and remote status.
- Assess open issues, recent PRs, and branch hygiene without executing destructive commands.

### 2. Session Recap: `/ahoy`
When the captain invokes `/ahoy`:
- Provide a concise recap of visible session events since the last captain message.
- Highlight landed work, failed checks, and visibly unanswered decisions.
- Never re-crawl the codebase or burn tokens on redundant state gathering.

### 3. Definition of Done: `ship-landing`
Before tearing down any worker task or releasing a worktree:
- **Named-Head Verification**: Ensure the worker's completed commit exists on the upstream target branch or remote repository. A commit present only in a disposable local copy is strictly NOT done.
- **Teardown Discipline**: Stop and investigate if teardown reports uncommitted or unlanded work. Never force-clean a worktree without explicit discard authority from the Captain.
- **Safe Release**: Execute `treehouse return <path>` so the pool preserves caches for future runs.

### 4. Recovery & Calm: `firstmate-calm`
- Monitor worker health using `herdr agent list` or watcher state sockets.
- If a crewmate is blocked or repeating tools, steer with concise feedback rather than killing prematurely.
- Enforce token-aware pauses and avoid frantic polling loops.

## Non-Negotiable Standards

- One captain at the helm; never run conflicting parallel orchestrators on the same branch.
- Preflight quota limits with `npx -y quota-axi` before dispatching fleets larger than two crewmates.
- Every task must finish with runtime proof (tests, lint, typecheck, or DevTools verification).

## Invocation

Load when:
- Dispatching or supervising multiple worker agents
- Handling task lifecycles, worktree handoffs, or stall recovery
- Structuring captain-and-crew orchestration sessions
