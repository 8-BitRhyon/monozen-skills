---
name: backpass
description: "Gradient descent for agent memory and instructions. Evaluates real agent session transcripts across harnesses, computes failure patterns, and proposes evidence-backed edits to AGENTS.md, CLAUDE.md, and skills under a strict token budget. Load when updating agent rules, pruning context drift, or auditing session failures."
---

# backpass: Gradient Descent for Agent Memory

> **Scope:** A local-first, transcript-driven system for iteratively refining `AGENTS.md`, `CLAUDE.md`, and project skills. Analyzes real execution traces to propose evidence-backed rule updates under a strict token budget.

## Core Principles

- **Local-First & Private**: Reads raw transcript stores directly from local disk or over SSH across supported agent harnesses (Claude Code, Pi, OpenCode, Codex). No data leaves your machine; model calls route through local `acpx` adapters.
- **Evidence-Gated Standard**:
  - Every proposed rule modification must cite verbatim transcript excerpts.
  - Adding, rewriting, or removing a rule requires independent corroboration from at least two distinct sessions.
  - Bounded, incremental steps: Never rewrite memory files from scratch.
- **Token Budget Ceilings**: Enforces strict character and token limits to preserve prompt-caching hit rates (Anthropic 90%, Gemini 75%, OpenAI 50%).

## Workflow

```bash
# Initialize backpass configuration for the repository
backpass init

# Run analysis: collect transcripts, compute failure loss, calculate gradients
# Generates proposed edits in memory without touching tracked files
backpass

# Review and apply proposed edits interactively (uses lavish-axi UI)
backpass apply

# Terminal review fallback (headless or plain text)
backpass apply --no-ui

# Train global user memory across all local projects
backpass --scope user
```

## Review Guidelines

When reviewing backpass proposals:
1. **Verify the evidence**: Confirm that the cited transcript quotes represent recurring developer friction or agent failure, not a one-off anomaly.
2. **Preserve conciseness**: Ensure added instructions follow existing codebase standards (no em dashes, no machine-specific paths, pure imperative verbs).
3. **Check token impact**: Reject edits that add verbose boilerplate or duplicate existing guidance.

## Invocation

Load when:
- Reviewing recurring agent mistakes or hallucinations across sessions
- Optimizing and compacting `AGENTS.md` or `CLAUDE.md` files
- Auditing prompt-caching efficiency and token consumption
