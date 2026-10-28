# Research Protocol

Detailed protocol behind `design-research`. Use it when the brief needs evidence, not when a section only needs polish.

## Step 1: Frame The Decision

- Input: the decision, existing evidence (analytics, tickets, reviews, interviews).
- Action: one page with decision, questions, non-goals, deadline, and confidence bar. Pick 2-4 competitors.
- Output: `RESEARCH_BRIEF.md` section inside `DESIGN_BRIEF.md`.
- Stop: every question maps to a decision and a date.

## Step 2: Teardown Competitors

- Input: 2-4 competitors, 3-5 core tasks.
- Action: run the same tasks on each. Capture positioning, flow, steps, time, pricing, onboarding, trust signals, and reviews. One row per observation.
- Heuristic lens: visibility, match to the real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, help and documentation.
- Score each finding 0-4 on frequency, impact, and persistence.
- Output: competitor matrix plus screenshots.
- Stop: all tasks covered; every claim linked to evidence; no new pattern in the last competitor.

## Step 3: Gather User Signals

- Input: 5 recent users or reviews per segment.
- Action: one 5-second test (what is this page for?), one first-click test (where do you start?), three short interviews. Rebuild the switch timeline: first thought, passive look, active look, decision, first use.
- Ask for artifacts. Do not pitch.
- Output: notes plus a forces table: push, pull, anxiety, habit.
- Stop: no new codes in the last 2-3 interviews, or the deadline arrives. Treat saturation counts as priors, not guarantees.

## Step 4: Synthesize

- Input: competitor evidence and user notes.
- Action: one finding per row with evidence IDs, frequency, impact, severity, confidence. Convert jobs to job stories: "When [situation], I want [motivation], so I can [outcome]."
- Output: `UX_FINDINGS` section.
- Stop: every finding has 2+ sources or is tagged single-source; every severity 3-4 finding has a flow and evidence; counter-evidence recorded.

## Step 5: Convert To Requirements

- Input: findings.
- Action: each job story becomes a testable requirement: "When X, the system must Y within Z." Add acceptance criteria and trace to a finding ID. Rank by severity x confidence / effort.
- Output: requirements table plus a traceability column.
- Stop: every in-scope finding has a requirement or a written "won't fix"; every requirement is testable.

## Step 6: Validate And Close

- Input: prototype or build, requirements, top risks.
- Action: 5-user task test per segment, or a heuristic re-check. Record pass or fail per requirement.
- Output: validation notes, updated findings.
- Stop: top 3 severity 3-4 issues pass or are accepted in writing; remaining unknowns are reversible or instrumented.

## Confidence Scale

| Level | Evidence |
|---|---|
| High | 2+ independent sources plus observed behavior |
| Medium | 1 source plus a pattern |
| Low | Expert opinion only |

Build must-haves on high or medium confidence. Turn low-confidence items into experiments.

## Stop Rules

Build when:

- Top 3 risks each have 2+ independent sources.
- No new pattern in the last 2-3 comparisons.
- Every must-have traces to a finding.
- Remaining unknowns are reversible or instrumentable.

Keep researching when:

- A severity 3-4 issue has no known cause.
- A core job or switch story is missing.
- Competitors disagree and you cannot explain why.
- The decision is a one-way door.

## Sources

- Heuristic evaluation: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- Ten heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Severity ratings: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- Competitive usability evaluations: https://www.nngroup.com/articles/competitive-usability-evaluations/
- Five users: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- Jobs to be done: https://hbr.org/2016/09/know-your-customers-jobs-to-be-done
- Four forces: https://jobstobedone.org/the-four-forces/
- Job stories: https://www.intercom.com/blog/using-job-stories-design-features-ui-ux/
- Awwwards evaluation: https://www.awwwards.com/about-evaluation/
