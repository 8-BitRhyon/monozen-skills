---
name: prompt-engineering-loop
description: Lean iterative prompt refinement protocol - ELI10 structuring, clarifying questions, working examples, adversarial pressure testing, and verification-ladder stopping criteria for AI agent instructions.
---

# Prompt Engineering Loop

> **Scope:** Turn one-shot prompts into compounding, verified output. Six steps, no ASCII art, no filler.

## The 6 Steps

1. **ELI10** - Ask the agent to explain the domain ground-up first. Exposes hidden assumptions and builds shared vocabulary.
   ```
   Explain [topic] like I'm 10. No jargon without definition, use concrete analogies.
   ```

2. **5 Clarifying Questions** - Before output, require exactly 5 questions covering: constraints, success criteria, preferences, risks, context. Answer them thoroughly; output quality tracks answer quality.

3. **Show, Don't Tell** - Provide a concrete example you consider excellent plus the specific attributes that make it good. No example? Provide 2-3 partial references and name the trait each captures.

4. **SKILL / DRY** - Any prompt pattern repeated 3+ times or with 5+ constraints becomes a skill. Load existing skills instead of re-explaining.

5. **Sparring Partner** - Agents are sycophantic. Activate critic mode explicitly:
   ```
   Find flaws. Challenge every assumption. Ask what if X fails at 0 / 10000 / null.
   Surface failure modes, alternatives, maintenance burden, security gaps.
   ```
   Routinely challenge at least 3 assumptions before proceeding.

6. **Loop To Verification** - Do not stop at "looks good". Stop at a verifiable outcome with YOUR verification:
   ```
   Don't stop until [SPECIFIC OBSERVABLE OUTCOME]. You run: [command] and check [assertion].
   If FAIL: fix root cause and repeat. If PASS: confirm and STOP. Report only the finale result.
   ```

## Verification Ladder (escalate until the task needs)
| Level | Method |
|---|---|
| 1 | LLM self-check |
| 2 | Static analysis (lint, typecheck) |
| 3 | Unit tests |
| 4 | Integration / API tests |
| 5 | Browser automation (chrome-devtools-axi) |
| 6 | Deploy preview + curl smoke test |
| 7 | Production canary with rollback |

Choose the minimum level that proves the claim. Do not burn tokens above what the task requires.

## Anti-Patterns
- Vague adjectives ("make it viral"): specify measurable criteria instead.
- Stopping at the first plausible answer: loop until SPECIFIC outcome verified.
- Accepting cheerleading: force sparring mode on any consequential design.

## Invocation
Load when refining prompts, iterating on research output, or pressure-testing any plan before implementation.