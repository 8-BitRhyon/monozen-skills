---
name: design-research
description: Turns a design decision into evidence with curated references, competitor teardowns, UX findings, testable requirements, and three concept directions in DESIGN_BRIEF.md. Use before a redesign or when the direction is unclear.
---

# Design Research

> Research is decision support. Stop when the next competitor or interview adds no new pattern.

## Contract

- Input: decision, audience, constraints, deadline.
- Output: `DESIGN_BRIEF.md` with references, competitor matrix, UX findings, requirements, and 3 directions.
- Stop: every must-have traces to evidence; the last competitor added no new pattern.

## 1. Frame

- One sentence: "We are deciding ___ so that ___."
- Name the audience and the one job they hire the page to do.
- List constraints: stack, brand, accessibility, time, and what cannot change.
- Define "good" as 3-5 observable criteria, not adjectives.
- Use `grilling` for decisions. Facts are your job; decisions are the user's.

## 2. Collect

**References (3-6).** For each: source, what to borrow (layout, type, motion), what to avoid. Prefer shipped products and award winners over shot galleries. Curate for collision: pair unrelated domains, not near-duplicates.

**Competitors (2-4).** Run the same 3-5 tasks on each. Record steps, time, friction, trust signals, and one screenshot per task. Use Nielsen's 10 heuristics as the lens.

**User signals (5).** One 5-second test, one first-click test, and three short interviews or reviews. Label strength: observed, reported, inferred.

## 3. Convert

- Turn findings into job stories: "When ___, I want ___, so I can ___."
- Turn each job story into a testable requirement: "When X, the system must Y within Z."
- Rank by severity x confidence / effort. Write "won't fix" reasons for the rest.
- Propose 3 directions. Each: thesis, reference anchor, layout idea, and the risk it takes.

## 4. Stop Rules

- Build when top risks have 2+ independent sources and every must-have traces to a finding.
- Keep researching when a severity 3-4 issue has no cause, or competitors disagree without explanation.
- Stop when findings repeat, the decision is clear, or the deadline arrives. Log deferred questions with an owner.

## Artifact

Use [DESIGN_BRIEF.md](templates/DESIGN_BRIEF.md). One file. Deep protocol in [research-protocol.md](references/research-protocol.md).

## When To Load

- Redesign or new page, before visual work.
- The direction is contested or the agent keeps missing.
- The user asks for competitor analysis, UX research, or references.
