# Hex Dotfiles

Portable Hex configuration from the live workstation. This is the transform engine and mode policy, not the personal vocabulary.

## What is here

| File | Purpose |
|---|---|
| `hex.config.ts` | Deterministic QuickJS transformations for code, prose, and chat |
| `dictation_processing.json` | Mode routing, prompts, model choice, deadlines, and the speed profile |

## What is deliberately excluded

- `VOCABULARY_MEMORY.md` and any project, person, or client names.
- Dictation history, meeting transcripts, and retained audio.
- Machine-specific paths, credentials, and app history.
- The generated `hex.d.ts` and `AGENTS.md`, which Hex owns and rewrites.

## Install

Back up the live config first:

```bash
mkdir -p ~/.config/hex/backups
cp ~/.config/hex/hex.config.ts ~/.config/hex/backups/hex.config.ts.bak
hex settings get dictation_processing --json > ~/.config/hex/backups/dictation_processing.bak.json
```

Copy the portable transform engine:

```bash
cp dotfiles/hex/hex.config.ts ~/.config/hex/hex.config.ts
hex commands check
```

Apply the mode policy:

```bash
hex settings apply dotfiles/hex/dictation_processing.json
hex settings get dictation_processing --json
```

Read back the result. The important lines are:

- `Development & Coding` has `post_processing.enabled = false`.
- `Social`, `Team Chat`, and `Global` use a fast model with `variant = "low"`.
- Every mode has a 2 second deadline, so a slow rewrite falls back to the deterministic output.

## Speed profile

Measured on this workstation:

| Path | Cost |
|---|---|
| `deterministicCodePolish` | about 0.012 ms |
| `deterministicProsePolish` | about 0.009 ms |
| `deterministicChatPolish` | about 0.006 ms |
| OpenCode default rewrite, short prompt | about 2.3 to 2.4 s |
| `opencode-go/claude-haiku-5-5`, `variant: low` | about 1.0 to 1.15 s |
| `opencode-go/gpt-5.6-luna`, `variant: low` | about 1.4 to 1.6 s |

The deterministic engine is not the bottleneck. The multi-second delay comes from the OpenCode rewrite. The policy here removes it from coding and caps it elsewhere.

## Email addresses

- Literal addresses are preserved. They are not sentence-capitalized, and a lone address does not get a trailing period.
- Spoken forms like `rhyonfs at gmail dot com` and `rhyonfs at gmail.com` become `rhyonfs@gmail.com`.
- Multi-part domains such as `gmail dot co dot uk` are supported.
- The spoken conversion uses a conservative provider allowlist: Gmail, Googlemail, Outlook, Hotmail, Live, iCloud, Me, Mac, Yahoo, Proton, Protonmail, Hey, Fastmail, and Zoho. This avoids turning ordinary prose like `meet me at the dot com` into an address.
- Custom domains are not converted from spoken form. Say the literal address, or extend `EMAIL_PROVIDERS` in `hex.config.ts`.
- Add unusual names to the live vocabulary with `hex vocabulary add`. Vocabulary stays local and is not committed here.

## Tuning

- If `opencode-go/claude-haiku-5-5` is not in your OpenCode catalog, use `opencode` with `"variant": "low"`, or another fast model.
- Review the `applications` and `browser_hosts` arrays before applying. They are macOS bundle IDs and sites, not personal data, but they are tuned to this workstation.
- If a mode feels too aggressive, raise `deadline_seconds` to 3. Do not return to 30. A 30 second deadline means a slow rewrite is allowed to become a 30 second dictation.
- Keep the deterministic transforms first. They are cheap and catch fillers, casing, symbols, email addresses, and punctuation before the model sees the text.

## Verify

```bash
hex commands check
hex settings get dictation_processing --json
hex logs | tail -20
```

After a dictation, `hex logs` prints the processing latency. Coding should be sub-second. Prose should be near one second plus transcription.

## Ownership

This directory is the portable copy. The live source of truth is `~/.config/hex/`. When the live config changes, copy the generic parts back here and re-run `hex commands check`.

See `HANDOFF.md` for the agent handoff prompt.
