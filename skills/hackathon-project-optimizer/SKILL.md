---
name: hackathon-project-optimizer
description: Maximizes hackathon judged score per engineering hour through demo-first ideation, feature pruning, spec lock, parallel worktree execution, anti-slop UI audit, and live-demo judging. Use when ideating, scoping, building, or pitching a hackathon project.
---

# Hackathon Project Optimizer

> Scope: one undeniable live demo beats a complete product. Optimize for what a tired judge sees in 15 seconds.

## 1. Demo-First Ideation

- **Work backward from the win.** Write the judge's reaction first: "They won because they ___." Build toward that sentence.
- **10-second rule.** A non-domain judge must restate the problem within 10 seconds. Rewrite the hook until they can.
- **Anti-generic filter.** Reject first-thought LLM ideas (wrapper chat, study buddy, CRUD dashboard). Push toward a specific, visible bottleneck with a physical payoff.
- **Reference-first UI.** Collect 2-3 concrete screenshots or shipped products before styling. Agents replicate references better than they invent from a blank brief.
- **Feasibility dial.** Wildest buildable concept, minus one order of complexity.

## 2. Feature Pruning

Lock 1-3 hero features that prove the thesis. Auto-cut:

- Multi-provider OAuth, profile pages, settings, theme toggles.
- Generic chat sidebars, analytics dashboards, onboarding tours.
- Any screen the demo script never visits.

Every file serves the demo path. Mock external services, never the demo path.

## 3. Spec Lock (interview gate)

No code before `SPEC.md`. Ask 3-5 pointed questions per round until ambiguity is gone:

1. Data flow: where does state originate, where does it persist?
2. UI states: empty, loading, error, and the money shot.
3. Real vs mocked: which integration runs live during judging?
4. Failure modes: what breaks on bad network or cold start?
5. Ownership: which files may each parallel task touch?

`SPEC.md` holds the 15-second hook, a demo script with timed beats, the data model, file ownership per task, and a verify command per task.

## 4. Parallel Execution

- Stack familiarity wins. New tech must buy demo clarity, not resume value.
- One task per git worktree, split by file ownership so merges never conflict.
- Each brief: goal, files in scope, acceptance criteria, verify command, non-goals.
- Route by strength: layout and motion to the strongest UI model; state, concurrency, migrations, and adversarial review to a backend model (`codex exec` or an isolated worker).
- Integrate at demo boundaries, not at the end. A merged happy path beats five perfect branches.
- Budget: 2-3 hours spec, 5-6 hours parallel build, 1 hour manual polish.

## 5. Anti-Slop UI Audit

Banned: purple-blue gradients, unstyled component defaults, metric walls, text-heavy heroes.

- The primary demo action owns most of the viewport's visual weight.
- Check hierarchy at desktop, then phone.
- Motion only for state change: 120-240 ms, purposeful. Skeleton to content, press feedback, list reorder. No ambient animation.
- With DOM annotations, change the cited component tree only. Do not restyle the page.

## 6. Demo Proof

- Rehearse on the deployed URL: fresh profile, cold cache, no pre-warmed auth.
- Record a fallback video, then demo live.
- Never fake a step. If a feature is mocked, say so and keep the real core on screen.
- Keep one offline-safe path in case venue wifi fails.

## 7. Judging

- 2-minute track: problem in one sentence, live wow moment, one trade-off, one extension.
- Hold the floor with substance; judges stay where they learn.
- Answer skepticism with the cut you chose: "We dropped X to ship Y in 24 hours."
- Close on the working demo, not a slide.

## Invocation

Output a Hackathon Audit before code:

1. 10-second hook: pass or fail, plus rewrite.
2. Hero features (max 3) and the cut list.
3. Demo path and the single wow moment.
4. Highest-leverage next action with its verify command.
