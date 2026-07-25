---
name: context-engineering
description: Optimizes agent context window setup, token budget management, file indexing, and session memory across long-running tasks.
---

# Context Engineering Skill

> **Scope:** Universal patterns for loading, structuring, and maintaining the right context for any agentic task. Prevents "I didn't know that file existed" and "I assumed X but it was Y".

---

## Context Layers (Load in Order)

### Layer 0: Project Constitution (Always)
- `AGENTS.md` / `CLAUDE.md`  -  agent instructions, rules, pitfalls
- `design.md` / `ARCHITECTURE.md`  -  system design, invariants
- `README.md`  -  project purpose, quickstart
- **Rule:** Read these FIRST. They define what "correct" means.

### Layer 1: Code Map (Per Task)
```bash
# Get structure
glob **/*.js
glob **/*.test.js

# Find relevant area
grep -r "theme-changed" --include="*.js"
codebase_search "theme toggle boot guard"
```
**Output:** File list + line numbers + 3-line context snippets.

### Layer 2: Deep Reads (Targeted)
```bash
# Read only what matters
read Website/assets/js/boot.js:1480:1500
read Website/globe-module.js:970:1020
```
**Rule:** Read with purpose  -  "find the theme toggle handler", not "read boot.js".

### Layer 3: Runtime Reality (Verification)
```bash
# Chrome DevTools for live state
npx -y chrome-devtools-axi evaluate --url https://rhyon.dev --expression "window.__bootFinished"
npx -y chrome-devtools-axi snapshot --url https://rhyon.dev --selector '#threeGlobeContainer'
```
**Rule:** Tests lie. Browser tells truth.

### Layer 4: History (When Stuck)
```bash
# Local session recall
kilo_local_recall search --query "theme toggle guard"
kilo_local_recall read --sessionID <id>

# Git history
git log --oneline -20 -- Website/assets/js/boot.js
git show <commit>:Website/assets/js/boot.js | head -200
```

---

## Context Budget Management

| Layer | Token Cost | When to Load |
|-------|------------|--------------|
| Constitution | ~2k | **Always** (session start) |
| Code Map | ~1k | Per task area |
| Deep Reads | ~500/file | Only files you'll edit |
| Runtime | ~1k | Verification phase |
| History | ~2k | Only when blocked |

**Technique:** Use `Task` agents for parallel context gathering  -  one reads constitution, another searches code, another checks tests.

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Assumption-driven** | "It probably works like X" | Read the file |
| **Context overflow** | 50 files read, none edited | Code map → targeted reads |
| **Stale context** | Fix works locally, breaks prod | Runtime verification mandatory |
| **History amnesia** | Re-solving solved problem | `kilo_local_recall` first |
| **Single-source** | Only tests, no browser | Layer 3 mandatory |

---

## Context Checklist (Per Task)

- [ ] Constitution read (AGENTS.md, design.md)
- [ ] Code map: affected files identified
- [ ] Deep reads: every file to be edited
- [ ] Test patterns: existing tests in area read
- [ ] Runtime baseline: current behavior captured
- [ ] History check: similar fixes attempted?

---

## Invocation

Load when:
- Starting any non-trivial task
- Switching project areas
- Debugging "mysterious" behavior
- Onboarding to new codebase

---

## Evolution

| Version | Change |
|---------|--------|
| v1.0 | 4-layer model |
| v1.1 | Added token budget + parallel gathering |
| v1.2 | Added history layer + kilo_local_recall |