---
name: llm-as-verifier
description: "Verification framework from the Stanford + NVIDIA LLM-as-a-Verifier paper (arXiv:2607.05391): continuous scores from expectation over scoring-token logits, score granularity, repeated evaluation, criteria decomposition, and the probabilistic pivot tournament for candidate ranking. Load when evaluating open-ended output, choosing the best of N candidates, or grading work that deterministic assertions cannot judge."
---

# LLM-as-a-Verifier (Universal)

> **Scope:** Judge open-ended output with calibrated continuous scores instead of discrete pass/fail verdicts. Paper: arXiv:2607.05391. Official repo: https://github.com/llm-as-a-verifier/llm-as-verifier (pip install llm-verifier). Claude Code plugin: https://github.com/llm-as-a-verifier/TurboAgent (pip install turbo-agent). Reference CLI: `scripts/llm-verifier.mjs` (zero deps, OpenAI-compatible endpoint).

## Core Mechanism

Standard LLM judges emit one discrete score token, collapsing the scoring distribution and inflating ties. Instead, take the **expectation over the scoring-token distribution** (paper Eq. 3.1):

R = (1/CK) x sum over criteria c, repeats k, and score tokens g of p(v_g) x phi(v_g)

then normalize to [0,1] by the linear map (R - phi_min) / (phi_max - phi_min). The paper uses a letter scale (A..T, 20 levels) instead of digits so token logprobs can be extracted.

## Three Scaling Axes

- **Score granularity (G):** 20 levels (tokens A..T). Finer levels = better separation between good and bad solutions.
- **Criteria decomposition (C):** Weighted sub-criteria instead of one holistic prompt. Paper's coding rubric: specification, output, errors (equal weights).
- **Repeated evaluation (K):** Average K runs (paper default K=8). Variance shrinks as O(1/K).

## Protocol

1. **Decompose** the task into weighted criteria in `templates/rubric.json` (max ~5; weights sum to 1).
2. **Score** each candidate per criterion with `scripts/llm-verifier.mjs score` (logprob expectation over scale tokens). Never read a single token as the verdict.
3. **Repeat** K times (default 8); record mean and spread per criterion.
4. **Rank** candidate pools with `rank` (probabilistic pivot tournament, paper Fig. 6): ring pass -> pivot selection -> pivot rounds -> argmax w/c. Cost O(Nk) instead of O(N^2). TurboAgent adds a majority-voting shortcut: when a majority of candidates are identical, it skips the tournament.
5. **Track progress** with `progress`: per-step scores (the paper measures value-order correlation) reveal drift so hopeless paths are abandoned early.

## Pairwise Preference (Eq. 3.2)

Comparisons derive preference from the reward difference via the Bradley-Terry model: P(a > b) = 1 / (1 + exp(-(R_a - R_b))). Pairwise prompts are directed (a always in slot A, b in slot B); the ring pass in `rank` cancels positional bias by giving every candidate one appearance in each slot.

## Determinism Guard

- Verifier scores are for open-ended output only. Keep deterministic assertions for assertable behavior (see `test-driven-dev`).
- Freeze rubric + token scheme; log rubric hash and model id with every result.
- Only the token-free `--self-check` runs in CI (`npm run verify`). Models without logprob access need a two-stage workaround (paper appendix B.6); the paper uses Gemini 2.5 Flash (20 top logprobs) via Vertex/vLLM. TurboAgent ships K=1 per pair for latency (paper default K=8).

## Templates and Tooling

- `templates/rubric.json` - criteria decomposition rubric (scale, weights, thresholds)
- `templates/prompt.md` - verifier prompt template (single-token, A..T scale)
- `scripts/llm-verifier.mjs` - reference CLI: `--self-check`, `score`, `rank`, `progress`

## Invocation

Load when:
- Grading open-ended output (writing, plans, generated code) that assertions cannot judge
- Choosing the best of N candidate solutions or agent rollouts
- Monitoring agent task progress or debugging why a rollout drifted
