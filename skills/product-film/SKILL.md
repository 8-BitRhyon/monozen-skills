---
name: product-film
description: Produces a code-driven product film with a spoken script, real product captures, human voiceover alignment, thumbnail, and YouTube submission kit. Use when making a demo video, launch film, hackathon submission video, voiceover mux, or video thumbnail.
---

# Product Film

> A product film is a timed argument, not a screen recording. Write for the ear, prove with the product, and ship the kit with the cut.

## Contract

- Input: working product, proof hierarchy, claim ledger, brand tokens, human voiceover.
- Output: silent master, human cut, 1280x720 thumbnail, YouTube metadata, verification log.
- Stop: exact runtime, no clipping, every beat has audio, and the live asset matches the local file.

## 0. Intake

Read the repo, claim ledger, landing page, CI, and brand tokens first. Fill the brief from those. Ask only for missing decisions: runtime, narrator, hero proof, publish target, required links, and unverifiable claims. Confirm the brief before scripting. Question tree: [references/intake.md](references/intake.md).

## 1. Script First

- 135-145 words per minute. Short sentences. One idea per line.
- Word budget: 20s hook 35-40; 25s pain 52-58; 45s demo 80-90 each; 30s numbers 60-68; 15s vision 25-30.
- The 45-second demo beats leave 8-11 seconds for the screen. Do not fill them with narration.
- Explain jargon in plain words. The screen carries labels, JSON, and table numbers.
- Check density: a 76 wpm beat next to a 134 wpm beat reads as broken pacing.
- No em dashes. Put `[pause]` marks in the read script, not the VO string.

Start from [templates/storyboard.ts](templates/storyboard.ts). Full recipe: [references/film-pipeline.md](references/film-pipeline.md).

## 2. Build The Film

- Storyboard as data: scene start, duration, VO slot, cues, facts.
- Render with GSAP + Playwright frame stepping into ffmpeg. 1920x1080, 24 fps, 180 seconds.
- Capture real product states with Playwright. Never fake a UI state. Label test data.
- Render one process at a time. Two renderers on one output corrupt the MP4. Delete the old output first.
- Verify `duration=180.000`, 4320 frames, audio ends at 180.000, and it opens.

## 3. Human Voiceover

- Record one full take or six per-beat files. 48 kHz, quiet room, consistent level.
- Inspect with `ffprobe` and `silencedetect` before muxing.
- A full take is ready only if the beat starts line up. If it drifts, split at the silence gaps and place each beat at its scene start. Use [scripts/align_voiceover.py](scripts/align_voiceover.py).
- Tighten only the beat that overruns. `atempo` at 1.2 or less. State the change.
- Apply stereo before `loudnorm`; duplicating mono to stereo after normalization adds about 3 dB. Target -16 LUFS, true peak -2.0 dBFS.
- Check AAC peaks with `volumedetect`. A 0.0 dB peak means re-mux.

## 4. Thumbnail

- 1280x720, under 2 MB, exact text, high contrast.
- Prefer HTML/CSS + Playwright over image generation: exact text, no artifacts.
- One number contrast, one brand mark, one line. Check at 320x180.
- Copy [templates/thumbnail.html](templates/thumbnail.html) and replace the tokens.

## 5. Submission Kit

- Title: brand first for a hackathon, hook second. 60-70 characters.
- Description: first two lines carry the problem; include the 15-second proof, sample, repo, chapters, and modeled/measured labels.
- Category: Science & Technology. Audience: not made for kids.
- YouTube may show 3:01 for a 180.0 file. Trust `ffprobe`; use 179.0s if a form rejects it.
- Audit every form claim against CI and the claim ledger. See [references/submission-kit.md](references/submission-kit.md).

## 6. Workflow

Full workflow: [references/film-pipeline.md](references/film-pipeline.md#workflow).

## Invocation

Load when:

- Making a demo film, launch video, or hackathon submission video.
- Writing or rewriting a spoken script or voiceover.
- Muxing a human take, fixing pacing, or making a thumbnail.
- Preparing YouTube metadata or a submission kit.
