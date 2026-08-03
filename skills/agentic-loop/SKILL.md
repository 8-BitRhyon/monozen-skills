---
name: agentic-loop
description: Universal pattern for autonomous agent workflow - the core observe -> plan -> act -> verify cycle that prevents hallucination, drift, and incomplete work.
---

# Agentic Loop Skill

> **Scope:** Universal pattern for any autonomous agent workflow  -  the core observe→plan→act→verify cycle that prevents hallucination, drift, and incomplete work.

---

## The Loop (Non-Negotiable)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. OBSERVE │───▶│  2. PLAN    │───▶│  3. ACT     │───▶│  4. VERIFY  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      ▲                                                  │
      │                                                  ▼
      └──────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  5. DOCUMENT │
                    └─────────────┘
```

### 1. OBSERVE  -  Read Before Write
- **Tools:** `read`, `grep`, `glob`, `codebase_search`, `semantic_search`
- **Rule:** Never edit a file you haven't read. Never assume structure.
- **Output:** Concrete facts (file paths, line numbers, function signatures), not assumptions.

### 2. PLAN  -  Explicit, Testable Steps
- **Format:** Todo list with `content`, `priority`, `status`
- **Rule:** Each step must be verifiable (test passes, command succeeds, visual confirmed).
- **Anti-pattern:** "Fix the bug" → **Correct:** "Add ResizeObserver to globe container, write failing test, verify in Chrome DevTools"

### 3. ACT  -  Minimal, Focused Changes
- **Rule:** One logical change per edit. No "while I'm here" refactoring.
- **Tools:** `edit` (surgical), `write` (new files), `bash` (commands)
- **Guard:** If a change touches >3 files, split into separate tasks.

### 4. VERIFY  -  Evidence Over Confidence
- **Automated:** Tests (`npm test`), lint (`npm run lint`), typecheck (`npm run typecheck`)
- **Runtime:** `chrome-devtools-axi` for browser reality (not test mocks)
- **Deploy:** Preview URL + `curl` verification
- **Rule:** If verification fails, return to OBSERVE  -  never declare done on hope.

### 5. DOCUMENT  -  Close the Loop
- **Update:** `AGENTS.md` / `CLAUDE.md` / `design.md` / skill files
- **Commit:** Descriptive message linking change → reason → verification
- **Skill:** If pattern repeats, codify in a skill.

### 6. EXIT  -  Loop Boundaries (Non-Negotiable)
- Max 3 plan->act->verify iterations per task. After 3 failed verifications, STOP and escalate to the human with: what was tried, evidence of failure, and the decision needed.
- Exit when: verification passes at the task's minimum ladder level (see `prompt-engineering-loop`), OR the scope changed (re-plan from OBSERVE once, then escalate if still stuck).
- Never loop on hope: if two consecutive attempts fail for the same root cause, stop guessing and re-observe (read the code, not assumptions).
- A task that grows beyond 3 files or 2 concepts is a decomposition failure: stop, run `task-decomposition`, resume as sub-tasks.

---

## Monozen-Specific Rules (Agentic Loop Extension)
Load the `monozen-portfolio` skill before touching that project. It owns all theme lifecycle, WebGL safety, CSS load order, and pre-deploy audit contracts. Run its `security-guard-universal.sh` before commit/deploy in real repos: blocks IDs, secrets, fingerprints, legacy assets, unsigned commits.

## Invocation

Load when:
- Starting any autonomous task (observe -> plan -> act -> verify)
- User asks "do this task", "work on this", "figure out X"
- Resuming work with an unclear next step

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Write-before-read** | Edits wrong file, breaks imports | Mandatory `read` first |
| **Vague planning** | "Make it work" → infinite loop | Concrete todos with acceptance criteria |
| **Batch edits** | 50 files changed, can't bisect | One logical change per commit |
| **Test-after** | Tests pass but bug persists | TDD: test fails FIRST |
| **Local-only verify** | "Works on my machine" | Chrome DevTools + deploy preview |
| **Skip docs** | Next agent repeats mistakes | Update AGENTS.md every time |

---
