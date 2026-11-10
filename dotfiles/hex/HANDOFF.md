# Handoff: Hex portable config and speed profile

## Read first

- `dotfiles/hex/README.md`
- `dotfiles/hex/hex.config.ts`
- `dotfiles/hex/dictation_processing.json`
- `WORKSTATION.md`

## Context

The live Hex config is at `~/.config/hex/`. It contains a deterministic QuickJS transform engine plus a mode policy that calls OpenCode for post-processing. The multi-step rewrite made dictation slow: measured logs showed 3.7 to 4.6 seconds, with one 11.6 second run.

The portable copy is sanitized. It excludes `VOCABULARY_MEMORY.md`, names, paths, history, and transcripts.

## Goal

Review and finish the portable Hex configuration, then verify the speed profile without degrading formatting.

## Scope

Own:
- `dotfiles/hex/README.md`
- `dotfiles/hex/hex.config.ts`
- `dotfiles/hex/dictation_processing.json`
- `dotfiles/hex/HANDOFF.md`
- the Hex rows in `WORKSTATION.md`

Do not edit:
- `research/lauren-tan-agentic-workflows.md`
- `skills/llm-as-verifier/PROTOCOL.md`
- `skills/llm-as-verifier/references/`
- any personal vocabulary or history file

## Tasks

1. Inspect `dotfiles/hex/dictation_processing.json`.
2. Confirm `Development & Coding` has `post_processing.enabled = false`.
3. Confirm `Social`, `Team Chat`, and `Global` use a fast model and `variant = "low"`.
4. Confirm every mode has `deadline_seconds = 2`.
5. Run `hex commands check`.
6. Apply the policy:

   ```bash
   hex settings apply dotfiles/hex/dictation_processing.json
   hex settings get dictation_processing --json
   ```

7. Run one dictation in Ghostty and one in a prose app. Record the latency from `hex logs`.
8. If coding is not sub-second, or prose is not near one second plus transcription, report the exact latency and the model used. Do not add another LLM step.
9. Commit only `dotfiles/hex/` and the `WORKSTATION.md` Hex rows. Open a PR if the repository workflow requires it.

## Acceptance

- `hex commands check` reports 3 transformations.
- `hex settings get dictation_processing --json` shows the speed profile above.
- No personal names, paths, vocabulary, or transcripts are present.
- A Ghostty dictation is sub-second.
- A prose dictation is near one second plus transcription.
- The commit contains no unrelated files.

## Failure handling

- If the model ID is unavailable, fall back to `opencode` with `variant: "low"` and re-measure.
- If the 2 second deadline causes frequent fallbacks, raise it to 3 and re-measure. Do not return to 30.
- If a transform throws, run `hex commands check` and fix the config before touching settings.
- If the live config differs from the portable copy, back up the live config before applying anything.
