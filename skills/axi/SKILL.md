---
name: axi
description: "Designs agent-facing CLIs with the Agent eXperience Interface: TOON output, minimal schemas, truncation, aggregates, structured errors, ambient context, and contextual next steps. Use when building, wrapping, or reviewing a CLI that agents call."
---

# AXI: Agent eXperience Interface

> A CLI is an agent interface, not a human manual. Optimize for one-call answers, unambiguous state, and self-correcting errors.

Spec: https://axi.md. Output format: https://toonformat.dev/reference/spec.html.

Requires: `npx` for the wrapper CLIs.

## 1. Token-Efficient Output

- Emit TOON on stdout; keep internal logic on JSON.
- Convert at the output boundary. Expect about 40% fewer tokens than JSON.

## 2. Minimal Schemas

- Default lists: 3-4 fields (id, title, status).
- Long bodies belong in detail views.
- Offer `--fields` for explicit extras.
- Set default limits high enough to answer common cases in one call.

## 3. Truncation

- Never omit large fields. Show a 500-1500 char preview, the total size, and the escape hatch.
- Suggest `--full` only when content was truncated.

## 4. Aggregates

- Always include total count, not just page size.
- Inline cheap derived state (`checks: 3/3`, `comments: 7`) when it is the likely next question.

## 5. Empty States

- Say `0 results` with context. Blank output makes agents retry with different flags.

## 6. Errors And Exit Codes

- Idempotent mutations: closing a closed item is a no-op with exit 0.
- Structured errors on stdout with a fix command. Keep debug on stderr.
- No interactive prompts. Require flags.
- Unknown flags exit 2 and list the valid flags. Never silently ignore one.
- Exit codes: 0 success, 1 error, 2 usage.

## 7. Ambient Context

- Session hook first, skill second. The hook carries live state; the skill carries procedure.
- Install hooks only from an explicit setup command.
- Keep injected context tiny and scoped to the working directory.
- Support Claude Code, Codex, and OpenCode where practical.

## 8. Content First

- No args prints live state, not help.
- Identify the binary and its one-line purpose, then show the data.

## 9. Contextual Disclosure

- End with a few complete next-step commands.
- Use `<placeholders>` for runtime values.
- Omit hints when the output already answers the question.

## 10. Help And Version

- Every subcommand has concise `--help` with flags, defaults, and 2-3 examples.
- `-v`, `-V`, and `--version` print the bare version and exit 0.
- Keep the version path free of heavy imports so probes stay fast.

## Wrappers

- GitHub: `npx -y gh-axi`
- Browser: `npx -y chrome-devtools-axi`
- Quota: `npx -y quota-axi`
- Tasks: `npx -y tasks-axi`
- Review UI: `npx -y lavish-axi`
- SDK: `@kunchenguid/axi-sdk-js` (`runAxiCli`, `axi-sdk-js/fast-path`)

## When To Wrap

Wrap a CLI when it emits verbose JSON or tables, needs two calls for one answer, exits 0 on failure, prompts interactively, or hides totals and empty states.

## Verification

- No args shows live state.
- An empty result says zero explicitly.
- An unknown flag exits 2 and lists valid flags.
- `--version` prints the bare version quickly.
- A list shows totals and no invisible fields.

## Invocation

Load when:

- Building or wrapping an agent-facing CLI.
- Reviewing tool output that burns tokens or hides state.
- The user says "AXI", "wrap this CLI", or "agent-ergonomic".

---

Adapted from [kunchenguid/axi](https://github.com/kunchenguid/axi) (MIT). See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
