---
name: axi
description: "Build and use agent-ergonomic CLI wrappers (AXI style) instead of MCP: TOON output, minimal schemas, truncation hints, total counts, empty states, structured errors, exit codes 0/1/2, and next-step hints. Load when wrapping a CLI for agents or choosing a tool interface."
---

# AXI - Agent eXperience Interface

> **Scope:** Design rules for CLI tools that agents use directly. Prefer AXI CLIs over MCP servers because schema overhead dominates context: MCP averages ~185k tokens/task vs ~79k for AXI wrappers. Benchmark-proven: 100% task success at lowest cost with fewest turns.

## The 10 Principles (Cheat Sheet)

| # | Principle | Rule |
|---|---|---|
| 1 | Token-efficient output | TOON format, ~40% savings over JSON (no braces/quotes/commas) |
| 2 | Minimal default schemas | 3-4 fields per list row, `--fields` for more |
| 3 | Content truncation | Truncate long text, append `(truncated, N chars - use --full)` |
| 4 | Pre-computed aggregates | Always report `totalCount` and status summaries, no round trips |
| 5 | Definitive empty states | Print `0 results` explicitly, never blank output |
| 6 | Structured errors + exit codes | Idempotent mutations, errors to stdout, 0 success / 1 error / 2 unknown flag |
| 7 | Ambient context | Session status hooks installed first, on-demand skill second |
| 8 | Content first | No-args shows live state, not help text |
| 9 | Contextual disclosure | End output with `help[]` next-step command templates |
| 10 | Consistent help | Every subcommand has a concise `--help` |

## Live Placeholder

TOON format sketch:
```
issues[2]{number,title,state}:
  42,Fix login bug,open
  43,Add dark mode,open
```

## Usage (prefer wrappers over raw CLIs)
- GitHub: `npx -y gh-axi` (issue/PR/workflow/release/view, precomputed checks)
- Browser: `npx -y chrome-devtools-axi` (combined operations, query filtering)
- Other domains: `aws-axi`, `docker-axi`, `pg-axi`, `sqlite-axi`, `npm-axi`, etc.
- `gitWorktree`/`pi-worktree` wrappers for worktrees (see `git-worktree` skill).

## When to Wrap Something as AXI
Turn a raw CLI into an AXI wrapper when it:
- produces JSON/verbose tables by default (prune to TOON)
- needs two calls to answer one question (combine navigate + snapshot),
- exits 0 on everything (add explicit exit codes),
- drives interactive prompts (disable with `--yes`),
- shows no totals or empties (add aggregates).

## Writing Skill Prompts With AXI Tokens
Skill files should cost under ~1,000 tokens to load. To stay inside that budget:
- one rule per bullet, no prose paragraphs,
- examples as compact TOON/truncated tables,
- invoke `gh-axi` / `chrome-devtools-axi` rather than embedding MCP schemas.

## Verification
- First call with no args prints live state (not help).
- An empty result prints `0 results` explicitly.
- Unknown flag exits 2 and names the failure loudly.
- A dump of any list shows total counts and no invisible fields.

## Invocation

Load when:
- Wrapping a CLI for agents or choosing a tool interface
- User asks "build a CLI for X", "wrap this tool", "AXI wrapper"
- Debugging verbose agent tool output that burns tokens