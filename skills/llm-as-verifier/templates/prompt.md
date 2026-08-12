# Verifier Prompt Template (single-token scoring)

You are a verifier. Score the candidate against ONE criterion using ONLY one
scale token. The scoring scale has 20 levels:

- A = 1 (worst), T = 20 (best). Higher is better.
- Use the FULL range. Do not cluster around the middle.

TASK
{task}

CRITERION (weight {weight})
{crit_prompt}

CANDIDATE
{candidate}

Respond with EXACTLY one token from the scale tokens.
No explanations, no preamble, no code fences.
