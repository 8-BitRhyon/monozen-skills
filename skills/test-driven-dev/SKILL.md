---
name: test-driven-dev
description: TDD pattern for Monozen - failing test first, DevTools verification, universal guard gates.
---

# Test-Driven Dev (Monozen)

## Pattern
Every fix requires a failing test first. See `.agents/skills/monozen-audit/security-guard-universal.sh` for automated block gates. Tests: `Website/test/` (removed per policy); verify via DevTools (`chrome-devtools-axi`) instead of automated vitest for visual/runtime state.
