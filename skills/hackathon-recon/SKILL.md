---
name: hackathon-recon
description: Audits prior hackathon winners and the judging rubric to extract the evidence pattern, then maps your idea against it with weighted gaps and three moves. Use before ideation, after a loss, or when a judged comparison matters.
---

# Hackathon Recon

> Do not guess what judges reward. Read the winners, the rubric, and the miss list.

## Contract

- Input: hackathon name, rubric, winner list, and your idea or repo.
- Output: `RECON.md` with a winner table, rubric weights, a gap map, and three moves.
- Stop: every claim cites a repo file, a README line, or a rubric line.

## 1. Collect

- Winner repositories, demo videos, and writeups.
- The official rubric and the theme text.
- Public post-mortems from teams that did not place.

## 2. Extract Per Winner

| Field | Record |
|---|---|
| Theme | Which problem statement |
| Ground truth | What outside reference proves it |
| Baseline | What naive approach it beat |
| Sample size | Labeled cases and intervals |
| Demo shot | The 15-second moment |
| Reproduce | One command, no keys |
| Prior work | What predates the event |

## 3. Find The Invariant

- A pattern in 6 of 10 winners is a rule. Treat it as a requirement.
- A pattern in 2 of 10 is style. Do not copy it.
- Record the counterexamples. They show the boundary of the rule.

## 4. Map The Gap

For each rubric axis, record the winner median, your score, the gap, and the cheapest move.

- Multiply weight by gap. Sort descending.
- Fix the highest product first, not the easiest.

## 5. Output Moves

- Three moves. Each has a verify command.
- At least one move must improve evidence, not polish.
- Name what you will not do.

## 6. Delegate

- One subagent per winner cluster: physical, software, science.
- Each returns one table row plus one lesson.
- Synthesize the rows. Do not paste transcripts.

## Anti-Patterns

- Copying a winner's stack or UI instead of its evidence.
- Treating a 2-of-10 pattern as a rule.
- Reading the winners without the rubric.
- Recon that ends without a decision.

## Invocation

Load when:

- Entering a hackathon with a published rubric.
- After a loss, to find the real cause.
- A judged comparison decides the next move.
