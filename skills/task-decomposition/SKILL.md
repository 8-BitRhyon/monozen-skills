# Task Decomposition Skill

> **Scope:** Universal method to break any complex request into atomic, verifiable, parallelizable units. Prevents overwhelm, enables parallel execution, makes progress visible.

---

## Decomposition Principles

### 1. Atomicity
Each task = **one** verifiable outcome.
- ❌ "Fix the portfolio"
- ✅ "Globe squish: add ResizeObserver to container"
- ✅ "Story panel FOUT: move font preload before split-screen"

### 2. Independence
Tasks should not share mutable state.
- Globe fix → `globe-module.js` + `test/globe.test.js`
- Font fix → `boot.js` + `test/boot.test.js`
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
- [ ] Task 1.1: Audit current theme toggle flow → `grep theme-changed`
- [ ] Task 1.2: List all `__init`/`__destroy` pairs → `grep __.*Init`

#### Phase 2: Implementation (sequential)
- [ ] Task 2.1: Add guard to theme toggle (needs 1.1)
- [ ] Task 2.2: Write Prove-It test for guard (independent)

#### Phase 3: Verification (parallel after 2.x)
- [ ] Task 3.1: Full test suite
- [ ] Task 3.2: Chrome DevTools verification
- [ ] Task 3.3: Deploy preview + curl check

### Risks
- Theme toggle during boot: corrupts GemSmoke transition
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

Use `todowrite` with this structure:
```json
{
  "todos": [
    {"content": "Globe ResizeObserver: write failing tests", "status": "in_progress", "priority": "high"},
    {"content": "Globe ResizeObserver: implement fix", "status": "pending", "priority": "high"},
    {"content": "Font preload reorder: write failing tests", "status": "pending", "priority": "high"},
    {"content": "Font preload reorder: implement fix", "status": "pending", "priority": "high"},
    {"content": "Full test suite verification", "status": "pending", "priority": "high"},
    {"content": "Chrome DevTools verification", "status": "pending", "priority": "high"},
    {"content": "Deploy preview + curl verify", "status": "pending", "priority": "medium"}
  ]
}
```

**Rule:** Exactly ONE `in_progress` at a time. Update in real-time.

---

## Invocation

Load when:
- User request spans >3 files or >2 concepts
- You feel "where do I start?"
- Previous work had missed steps or rework
- Planning a multi-session effort

---

## Evolution

| Version | Change |
|---------|--------|
| v1.0 | Core decomposition + parallelization |
| v1.1 | Added todowrite integration |
| v1.2 | Added risk/mitigation column |