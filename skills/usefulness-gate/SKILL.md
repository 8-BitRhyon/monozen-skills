---
name: usefulness-gate
description: "Tests whether a product is worth building and whether users get value from it: problem evidence, technical spikes, task-based UX tests, and a build, pivot, or kill decision. Use before committing to a direction or after a design brief."
---

# Usefulness Gate

> Utility plus usability equals usefulness. A demo proves neither. Decide with observed behavior, not enthusiasm.

## Contract

- Input: problem, audience, proposed approach or design direction, constraints.
- Output: `USEFULNESS.md` with evidence, one spike result, one UX test result, and a decision.
- Stop: the decision is recorded with a threshold and the evidence that would reverse it.

Run after `design-research` when a brief exists, or before it when the problem itself is unproven. If the wedge is not chosen yet, run `alpha-loop` first.

## 1. Problem Evidence

- Who has the problem, how often, how painful, and what they do today.
- Record the switching trigger: what makes them look for a new solution.
- Label strength: observed behavior, reported experience, inferred.
- Park the idea if the problem is rare, mild, or already solved well enough.

Ask about past behavior, not hypothetical intent.

## 2. Technical Ideation

- Generate 2-3 approaches, not one. For each: mechanism, data flow, dependencies, failure modes, reversibility, build cost.
- Rank assumptions by fatal-if-wrong x uncertain. Pick the top one.
- Timebox a spike to answer it. Default: half a day, throwaway code, pass/fail.
- Use a walking skeleton for integration risk, a POC for feasibility risk, a concierge test for demand risk.
- Record the decision: context, options, choice, consequences.

## 3. UX Test

- Build the smallest task-based prototype that exercises the core job. No pitch, no tour.
- Test 5 representative users, think aloud, one at a time.
- Set thresholds before testing. Defaults: 4/5 complete the core task unaided; 3/5 describe the outcome unprompted; 3/5 would use it weekly.
- Measure completion, time, errors, comprehension, and repeat-use intent.
- Five users find problems, not statistical proof. State that limit.

## 4. Decide

- **Build:** problem evidence holds, the spike passes, the core task meets threshold.
- **Pivot:** the problem is real but the approach or UX fails. Change one variable.
- **Kill or park:** the problem is weak, or the workaround is better. Say so.
- Record what would change the decision.

## 5. Instrument Before Build

- Name the outcome metric, the event that proves it, the baseline, and the target.
- Track repeat use and task success, not signups or demo clicks.
- If the metric cannot be measured, the usefulness claim is not testable.

## Anti-Patterns

- Feature-first ideation before problem evidence.
- Treating a polished demo as proof of use.
- Asking "would you use this?" instead of observing a task.
- One technical approach, or a spike that quietly becomes the product.
- Testing friends, or leading users to the answer.
- Polishing UI before the core task succeeds.

## Artifact

Use [USEFULNESS.md](templates/USEFULNESS.md).

## Sources

- Nielsen, usability and utility: https://www.nngroup.com/articles/usability-101-introduction-to-usability/
- Savoia, pretotyping: https://www.pretotyping.org/
- XP spike: http://www.extremeprogramming.org/rules/spike.html
- Walking skeleton and ADR: https://peter.demin.dev/17_notes/04_spikes.html

## Invocation

Load when:

- Deciding whether to build a product or feature.
- Choosing between technical approaches.
- A design direction looks good but usefulness is unproven.
- The user asks "will anyone use this", "is this worth building", or "does this work".
