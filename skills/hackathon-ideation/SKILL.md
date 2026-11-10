---
name: hackathon-ideation
description: Generates and kills hackathon ideas before code, scoring theme fit, 15-second demo legibility, reachable ground truth, and baseline beatability, then locks one pick with a proof plan. Use when choosing what to build for a hackathon or a short judged sprint.
---

# Hackathon Ideation

> Pick the idea that can be proven, not the idea that sounds best. The demo is the spec.

## Contract

- Input: theme text, time budget, skills, data and hardware on hand.
- Output: `IDEA.md` with 10 candidates, 3 survivors, 1 pick, and a kill reason per cut.
- Stop: the pick names its ground truth, baseline, and 15-second shot.

## 1. Read The Theme First

- Copy the problem statement before generating. Do not retrofit it later.
- List what the theme rewards: physical consequence, scientific proof, or domain depth.
- List what it punishes: generic wrappers, dashboards, and advice bots.

## 2. Generate Wide

- Write 10 ideas in 20 minutes. One line each.
- Use four shapes: physical, data, workflow, absurd.
- Do not filter during generation.

## 3. Kill By Demo

Write the 15-second shot for each idea. Kill the idea if you cannot.

- Is there a visible consequence? Something moves, changes, or starts working.
- Can a non-domain judge restate the problem in 10 seconds?
- Does the shot need a merchant, customer, or partner? If yes, kill it.

## 4. Kill By Evidence

- Name the ground truth. External benchmark, public data, sensor, spec, or blind expert label.
- Can you get it by day 2 without permission? If no, kill it.
- Name the baseline. The default is "just prompt a model".
- If the idea cannot beat that baseline on the same rows, kill it.

## 5. Score

| Axis | Weight | Question |
|---|---|---|
| Impact | 30 | Who benefits, and how much? |
| Tooling | 25 | Does the model do real work, or decorate? |
| Depth | 20 | Can an engineer check the claims? |
| Demo | 25 | Does the 15-second shot land? |

Score each axis 1 to 5. A total of 12 or lower is a kill. A total of 20 or higher is a build.

## 6. Lock

- Write `IDEA.md`: hook, ground truth, baseline, demo shot, and the kill reason for each runner-up.
- Hand off to `hackathon-project-optimizer`. Fill `EVIDENCE.md` before code.

## 7. Record The Demo First

Before you build, record a 2:30 demo of the product you intend to have, with mocked data.

- Hour 0 to 1: extract every rubric row and pass-fail gate into one page.
- Hour 1 to 2: write six shots: problem, product, core action, failure case, one number, next step.
- Hour 2 to 4: build a walking skeleton with seeded data and no auth.
- Hour 4 to 6: record a rough voiceover, time it, and list every gap between the words and the runtime.

Play it for a stranger. Ask them to restate the user, the problem, and the number. If they cannot, the script is wrong, not the code.

The recording is also the fallback video when the live demo fails.

## Anti-Patterns

- Falling in love with the first idea.
- Choosing the theme after the build.
- An idea whose proof needs a partner you do not have.
- A demo that is a dashboard with no consequence.
- Ten ideas that share one shape.

## Invocation

Load when:

- Choosing what to build for a hackathon.
- A theme or rubric is announced.
- A short judged sprint needs a scoped bet.
