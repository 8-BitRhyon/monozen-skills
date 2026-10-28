---
name: design-loop
description: Runs a design iteration loop with cheap divergent variants, blind rubric critique, build at feel fidelity, click-to-annotate feedback on localhost, and targeted fixes. Use when a UI misses the mark or needs repeated visual iteration.
---

# Design Loop

> Diverge cheap, choose with a rubric, build for feel, annotate what is wrong, fix only that. Log every round in `DESIGN_LOG.md`.

Requires: `node` 18+ for the annotation collector.

## Contract

- Input: `DESIGN_BRIEF.md` or a named section, plus a running app.
- Output: chosen direction, resolved annotations, updated `DESIGN_LOG.md`.
- Stop: zero pending annotations; rubric pass; mobile, keyboard, and reduced-motion checks pass.

## 1. Diverge Cheap

- Produce 3 directions, not 20 polished comps. Each has a one-sentence thesis, one reference anchor, and a distinct layout.
- Split each direction into 3 cheap variants of the key section. Nine sketches, not nine finished pages.
- Use a different model per direction when available. Hide model labels from the reviewer.
- Keep variants as separate routes, static files, or worktrees. Never overwrite the current design before a pick.
- Shape only. No motion polish, no microcopy debates.

## 2. Converge Blind

Score each direction 0-2:

| Criterion | 2 means |
|---|---|
| Clarity | Primary action obvious in 5 seconds |
| Hierarchy | One focal point per viewport |
| Craft | Spacing, type, alignment survive zoom |
| Motion | Movement explains state |
| Distinctiveness | Not swappable for a template |
| Feasibility | Buildable at feel fidelity in time |

- Write one sentence naming the winner and why. A tie means the brief is unclear; return to `design-research`.
- Hybridize at most two directions. More becomes committee design.

## 3. Build At Feel Fidelity

- Real code, real content, real states. No lorem ipsum, no dead buttons.
- Build the money shot first, then empty, loading, error, success.
- One component tree per section. If a fix needs three files, the section boundary is wrong.
- Commit the pick before annotation starts.

## 4. Annotate On Localhost

- Start the collector from the project root: `node ~/.agents/skills/design-loop/scripts/collector.mjs --file .design/annotations.jsonl`.
- Inject the overlay with the loader in [annotation.md](references/annotation.md).
- The user clicks an element and writes the comment. The record carries selector, fallback chain, box, text, and styles.
- Work one severity class per round: `blocking`, then `important`, then `suggestion`.
- Fix only the annotated component tree. Do not restyle the page while resolving one comment.
- Verify the selector resolves and the layout changed with `chrome-devtools-axi`.
- Mark each annotation `resolved` with the file touched.

## 5. Polish And Hand Off

- Motion only for state change, 120-240 ms. No ambient animation.
- Check focus order, visible focus, and `prefers-reduced-motion`.
- Check 390 px and 1440 px.
- Hand off to `production-web-audit` before deploy.

## Anti-Slop Bans

- Purple-blue gradient defaults, unstyled component defaults, metric-card walls, text-heavy heroes.
- Decorative blobs, glassmorphism without a reason, three competing accents.
- Load animation that delays the first interaction.

## When To Load

- A UI misses the mark and the fix is visual, not functional.
- The user asks for variants, directions, critique, or a design review.
- The user wants to comment on a live page and have the agent apply it.
