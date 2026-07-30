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

---

## Monozen-Specific Rules (Agentic Loop Extension)
- Theme lifecycle: observe `data-theme` before editing; verify `__moonInit`/`__sunInit` called after `finishBoot()`.
- WebGL: never assume `preserveDrawingBuffer` is true; verify via `chrome-devtools-axi`.
- CSS: observe load order (`tailwind → main → moon → sun`) before adding selectors.
- Security guard (`.git/hooks/pre-commit`) runs before every commit: blocks IDs, audit docs, legacy filenames, unsigned commits.
- Universal audit (`.agents/skills/monozen-audit/security-guard-universal.sh`) runs before deploy.

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Write-before-read** | Edits wrong file, breaks imports | Mandatory `read` first |
| **Vague planning** | "Make it work" → infinite loop | Concrete todos with acceptance criteria |
| **Batch edits** | 50 files changed, can't bisect | One logical change per commit |
| **Test-after** | Tests pass but bug persists | TDD: test fails FIRST |
| **Local-only verify** | "Works on my machine" | Chrome DevTools + deploy preview |
| **Skip docs** | Next agent repeats mistakes | Update AGENTS.md every time |

---
