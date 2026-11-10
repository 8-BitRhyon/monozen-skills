---
name: skill-authoring
description: Authors and audits agent skills with eval-first design, third-person trigger descriptions, progressive disclosure, and executable verification. Use when creating a skill, rewriting a bloated skill, or auditing skill quality.
---

# Skill Authoring

> A skill is a runnable protocol, not a wiki page. If the model already knows it, delete it. If a command can prove it, script it.

## 1. Eval First

Do not write documentation first.

1. Run the task without a skill. Record where the model fails: missed trigger, wrong order, skipped verification, invented facts.
2. Write 3 realistic scenarios in `evals/*.json` using [the eval template](templates/eval.json).
3. Baseline: run each scenario without the skill.
4. Write the minimum instructions that pass. No imagined requirements.
5. Re-run with the skill. Keep only what changes behavior.

If you cannot name the failure the skill prevents, do not create it.

## 2. The Description Carries The Trigger

The description is the only text always in context. Models under-trigger, so be specific and a little pushy.

- Third person: "Extracts...", not "I can..." or "You can...".
- State what it does and when to use it.
- Use the words a user would type.
- Do not summarize the workflow. The body owns the steps.
- Max 1,024 characters. No XML.

Example: "Reviews a git diff for correctness, security, and missing tests. Use when the user asks for a review, a PR check, or a pre-merge audit."

## 3. Shape

```
skill-name/
  SKILL.md          # protocol, under 1,000 tokens
  evals/*.json      # behavior scenarios
  scripts/          # deterministic steps, run not read
  references/       # detail loaded on demand, one level deep
  templates/        # starter artifacts
```

- Keep `SKILL.md` under 500 lines, and under this repo's 1,000-token budget.
- Move detail to references linked directly from `SKILL.md`. Never nest references.
- Add a table of contents to references over 100 lines.
- Say whether to run a script or read it.
- Offer one default, not a menu. Add an escape hatch only for a real case.

## 4. Write For Execution

- Imperative voice. Explain why a rule exists.
- Concrete commands, paths, and expected output.
- Every phase ends in an artifact or a check.
- State the stop condition: what must be true to finish.
- No time-sensitive facts without an "old patterns" section.
- No all-caps MUST walls. Use a rule plus a reason.

## 5. Verification

A skill is done when:

- 3 eval scenarios exist and the baseline failed at least one.
- A fresh session can follow it without asking a question.
- Every command runs on this machine, or the skill states the dependency.
- The repo gate passes: `npm run validate && npm test && npm run smoke`.
- The description triggers on the intended request and not on a near-miss.

## Anti-Patterns

- Restating model knowledge: what a PDF is, what TDD means, why tests help.
- A workflow summary in the description; the model follows the summary and skips the body.
- A five-skill bundle where one narrow skill would do.
- Prose with no artifact, check, or stop condition.
- Tool names and versions that rot. Move them to references.
- Assuming an uninstalled CLI. Declare the dependency.
- Copying another author's skill without license and provenance.

## Publish

1. Add `skills/<name>/SKILL.md` with a matching folder and name.
2. Add at least one `evals/*.json` scenario.
3. Run `npm run manifest`, then `npm run validate && npm test && npm run smoke`.
4. Commit one logical change. Note the source when adapted.

## Invocation

Load when:

- Creating a new skill.
- Rewriting a skill that is too long, too vague, or never triggers.
- Auditing skill quality before publishing.
