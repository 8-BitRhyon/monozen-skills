---
name: test-driven-dev
description: "Universal test-driven development protocol for any language or stack: write failing test first (red), minimal implementation (green), refactor, verify with real runtime evidence. Load when implementing any new feature, fixing a bug, or when a repo has no test-first discipline."
---

# Test-Driven Development (Universal)

> **Scope:** Red -> green -> refactor, for any language or framework. Applies to new features, bug fixes, and refactors. The test is the spec; the implementation proves it.

## The Cycle (Non-Negotiable)

1. **RED** - Write one failing test that names the behavior. Run it and watch it fail for the right reason (assertion fails, not compile/type error).
2. **GREEN** - Implement the minimal change that makes it pass. No extra code, no refactoring yet.
3. **REFACTOR** - Clean up under green. Run the full suite after each step.
4. **PROVE** - Verify beyond the unit: integration test, runtime observation (`chrome-devtools-axi` for web, CLI smoke, API call). Tests lie; runtime tells truth.

## Rules

- One behavior per test. Test the public contract, not internals.
- Never skip a failing test to go green. A red suite is a stopped clock; fix the cause.
- No test-after-only: if you wrote the implementation first, delete it and write the test first (or at minimum, prove the test fails without the implementation).
- Cover the edge cases: empty input, null, zero, max, concurrent, timeout.
- Commit per cycle stage when stages are large; one logical change per commit.

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| Test-after | Tests always green, never caught a bug | Write test first; watch it fail |
| Over-mocked | Tests pass, app broken | Prefer real dependencies at boundaries |
| Brittle assertions | Any refactor breaks tests | Assert behavior, not implementation details |
| Coverage theater | 100% coverage, zero value | Cover behaviors and edges, not lines |
| Skipped reds | `it.skip` / `xdescribe` accumulating | Zero skips unless tracked with owner + date |

## Verification

- `npm test` (or stack runner) green.
- New behavior has a test that fails without the implementation: `git stash` the implementation, run test, confirm red, unstash.
- Runtime check: `chrome-devtools-axi` console zero errors (web), or curl/CLI assertion (API/service).

## Invocation

Load when:
- Implementing any new feature or fixing any bug
- User says "test", "TDD", "make it pass", "prove it works"
- A repo lacks tests or tests are written after implementation
