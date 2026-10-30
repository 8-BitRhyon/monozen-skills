---
name: alpha-loop
description: "Runs a multi-agent ideation and scoping loop: facet scouts, competing theses, blind cross-judge, alpha selection, and a one-week wedge with kill criteria. Use when the direction, advantage, or scope is unclear."
---

# Alpha Loop

> From ambiguity to one testable bet. The deliverable is not a list of ideas. It is one wedge with an unfair reason to win and a cheap way to disprove it.

## Contract

- Input: goal, constraints, existing evidence, time budget.
- Output: `ALPHA.md` plus a one-week test brief.
- Stop: one wedge, one metric, one kill criterion, and a handoff.

## 0. Frame

- Restate the goal in one sentence and the decision it forces.
- Name the user, the job, and the current workaround.
- Write what "win" means as a measurable outcome.
- List constraints and non-goals.
- Use `grilling` for decisions. Facts are the loop's job.

## 1. Fan Out Facets

Spawn one subagent per lens, in parallel. Same brief shape, different lens.

| Lens | Question |
|---|---|
| User | Who hurts, how often, and what do they do today? |
| Market | Who solves it now, at what price, and what is missing? |
| Technical | What is hard, what is commodity, and what can we uniquely build? |
| Design | What would make this feel inevitable and easy? |
| Distribution | How does the first user hear about it and adopt it? |
| Risk | What kills this: legal, trust, platform, cost, or operations? |
| Alpha | What do we know, have, or do that others cannot copy quickly? |

Each scout returns: finding, evidence, implication, and one bet. No essays.

## 2. Form Competing Theses

- Write 2-4 theses, not one. Each: who, job, mechanism, alpha, and the risk it takes.
- The theses must be structurally different, not variants of one idea.
- Label them A/B/C so the judge is blind to which model wrote which.

## 3. Cross-Judge

- Spawn one judge from a different model family. It sees the theses and the rubric, not the authors.
- Score 0-2 on evidence, alpha durability, feasibility, wedge size, and speed to proof.
- Ask for a base and at most two grafts from the losers.
- A tie means the frame is unclear. Return to Phase 0. Do not average.

## 4. Select Alpha

Alpha is a durable reason to win, not a feature. Score it:

- **Insight:** do we know something the market does not?
- **Unfair edge:** data, distribution, cost, speed, taste, or integration.
- **Copyability:** how fast can a competitor close it?
- **Compounding:** does each user make the next one easier?

Stress-test the leader: a competitor copies it, a platform blocks it, costs double, distribution fails, users abuse it. Steelman both sides.

Pick the thesis with the strongest edge per week of proof. Graft at most two ideas. Do not merge all of them.

## 5. Scope To A Wedge

- One user, one job, one surface.
- One week, one metric, one kill criterion.
- The smallest test that changes the decision: concierge, prototype, or spike.
- Write what would make you stop.

## 6. Hand Off

- Design risk: `design-research` then `design-loop`.
- Usefulness risk: `usefulness-gate`.
- Build risk: `task-decomposition`.
- Keep `ALPHA.md` as the decision record. Rejected theses stay, marked rejected.

## Anti-Patterns

- Brainstorming features before naming the job.
- Ten ideas that are all the same idea.
- Choosing the safest thesis because it is easy to defend.
- Averaging theses into a committee product.
- Calling a demo "traction".
- A wedge with no kill criterion.

## Artifact

Use [ALPHA.md](templates/ALPHA.md).

## Invocation

Load when:

- The direction or advantage is unclear.
- Several projects or ideas could combine.
- The user asks "where can we win", "find the alpha", or "scope this".
- Before `design-research` or `usefulness-gate` on a new bet.
