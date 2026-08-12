---
name: llm-as-verifier
description: "Verification framework from the Stanford + NVIDIA LLM-as-a-Verifier paper (arXiv:2607.05391): continuous scores from expectation over scoring-token logits, criteria decomposition, repeated evaluation, pivot-tournament ranking, and task-progress tracking. Load when evaluating open-ended output, choosing the best of N candidates, or grading work that deterministic assertions cannot judge."
---

# LLM-as-a-Verifier (Universal)

> **Scope:** Judge open-ended output with calibrated continuous scores instead of discrete pass/fail verdicts. Reference CLI: `scripts/llm-verifier.mjs` (zero deps, OpenAI-compatible endpoint). Paper: arXiv:2607.05391.

## Why It Beats a Discrete Judge

Standard LLM judges emit one discrete score token. That collapses the scoring distribution, inflates ties, and hides partial credit. This framework instead takes the **expectation over the scoring-token distribution** (sum of p(t) x v(t) over the scale tokens) to produce a continuous score in [0,1]. Continuous scores separate good from bad solutions and stay comparable across runs.

## The Three Scaling Axes

- **Score granularity (G):** Use a fine-grained scale (default 20 levels, tokens A..T). More levels = better separation between positive and negative solutions.
- **Criteria decomposition (C):** Split evaluation into weighted sub-criteria (a rubric) instead of one holistic prompt. Reduces prompt complexity and bias.
- **Repeated evaluation (K):** Run each criterion K times (default 3) and average. Reduces variance; report the spread.

## Protocol

1. **Decompose** the task into weighted criteria in `templates/rubric.json` (max ~5 criteria; weights sum to 1).
2. **Score** each candidate per criterion with `scripts/llm-verifier.mjs score` (logprob expectation over scale tokens). Never read a single token as the verdict.
3. **Repeat** K times; record mean and spread per criterion.
4. **Rank** candidate pools with `rank` (pivot tournament: sample to pick pivots, then compare the rest against pivots only, O(N x sqrt(N)) instead of O(N^2)).
5. **Track progress** across agent steps with `progress`: per-step scores reveal drift early so hopeless paths are abandoned before more tokens burn.

## Decision Rule

Composite = sum(weight x normalized criterion score). Pass when composite is at or above the rubric `passThreshold` (default 0.8). Between `reviewThreshold` and pass = review, naming the strongest and weakest criterion. Below the review threshold = fail with reasons.

## Determinism Guard

- Verifier scores are for open-ended output only. Keep deterministic assertions for assertable behavior (see `test-driven-dev`).
- Freeze the rubric and token scheme before scoring; log the rubric hash and model id with every result so scores are reproducible.
- Never let verifier calls block CI: `npm run verify` runs the token-free `--self-check` only.

## Templates and Tooling

- `templates/rubric.json` - criteria decomposition rubric with scale, weights, thresholds
- `templates/prompt.md` - verifier prompt template (scale-token scoring instructions)
- `scripts/llm-verifier.mjs` - reference CLI: `--self-check`, `score`, `rank`, `progress`

## Invocation

Load when:
- Grading open-ended output (writing, plans, generated code) that assertions cannot judge
- Choosing the best of N candidate solutions or agent rollouts
- Monitoring agent task progress or debugging why a rollout drifted
