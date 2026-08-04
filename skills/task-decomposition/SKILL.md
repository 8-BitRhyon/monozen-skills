---
name: task-decomposition
description: Breaks complex engineering requests into ordered, independent, testable sub-tasks with clear acceptance criteria.
---

# Task Decomposition Skill

> **Scope:** Universal method to break any complex request into atomic, verifiable, parallelizable units. Prevents overwhelm, enables parallel execution, makes progress visible.

---

## Decomposition Principles

### 1. Atomicity
Each task = **one** verifiable outcome.
- ❌ "Fix the portfolio"
- ✅ "<unit>: add <behavior> to <module>"
- ✅ "<unit>: move <dependency> before <phase>"

### 2. Independence
Tasks should not share mutable state.
- <unit A> → `module-a.js` + `test/a.test.js`
- <unit B> → `boot.js` + `test/boot.test.js`
- **Can run in parallel** → use `Task` tool for parallel agents

### 3. Verifiability
Every task has a **done definition** (test, command, visual).
```markdown
- [ ] Globe ResizeObserver
    - [ ] Write 5 failing tests in test/globe.test.js
    - [ ] Implement _resizeObserver in globe-module.js
    - [ ] Run npm test → 182 pass
    - [ ] chrome-devtools-axi verify _resizeObserver exists
```

### 4. Ordering
- **Sequential:** Task B needs Task A's output
- **Parallel:** Tasks independent → run together
- **Blocked:** External dependency → mark `blocked`, note unblocker

---

## Decomposition Template

```markdown
## Request: <user's high-level ask>

### Analysis
- Affected files: `glob app/**/*.js`
- Risk areas: theme lifecycle, WebGL cleanup
- Unknowns: need to check current test coverage

### Tasks (in dependency order)

#### Phase 1: Foundation (parallel)
- [ ] Task 1.1: Audit current <feature> flow → `grep <signal>`
- [ ] Task 1.2: List all <init>/<destroy> pairs → `grep <pattern>`

#### Phase 2: Implementation (sequential)
- [ ] Task 2.1: Add guard to <feature> (needs 1.1)
- [ ] Task 2.2: Write Prove-It test for guard (independent)

#### Phase 3: Verification (parallel after 2.x)
- [ ] Task 3.1: Full test suite
- [ ] Task 3.2: Runtime verification (browser/CLI)
- [ ] Task 3.3: Deploy preview + curl check

### Risks
- <feature> during boot: corrupts <transition>
- Mitigation: guard + test + manual verify
```

---

## Parallelization Rules

| Pattern | Tool | Example |
|---------|------|---------|
| **Read-only searches** | Multiple `grep`/`glob`/`codebase_search` | Find all theme listeners, all WebGL canvases |
| **Independent file edits** | Multiple `edit` in one message | Fix CSS in moon.css + sun.css simultaneously |
| **Independent test files** | Multiple `Task` agents | Write globe.test.js + boot.test.js in parallel |
| **Verification** | `bash` + `chrome-devtools-axi` | Run tests + snapshot in parallel |

**Never parallelize:** Sequential dependencies, shared file writes, stateful operations.

---

## Progress Tracking

Use `todowrite` with this structure (one `in_progress` at a time, update in real-time):
```json
{"todos": [
  {"content": "<unit A>: write failing tests", "status": "in_progress", "priority": "high"},
  {"content": "<unit A>: implement fix", "status": "pending", "priority": "high"},
  {"content": "<unit B>: write failing tests", "status": "pending", "priority": "high"},
  {"content": "<unit B>: implement fix", "status": "pending", "priority": "high"},
  {"content": "Full test suite verification", "status": "pending", "priority": "high"},
  {"content": "Runtime verification (browser/CLI)", "status": "pending", "priority": "high"}
]}
```

---

## Invocation

Load when:
- User request spans >3 files or >2 concepts
- You feel "where do I start?"
- Previous work had missed steps or rework
- Planning a multi-session effort
