---
name: asd-ste100
description: Enforce ASD-STE100 (Simplified Technical English) specification rules for all technical documentation, Markdown files, and code comments with zero em dashes.
---

# ASD-STE100 Simplified Technical English Protocol

> **Scope:** Enforce ASD-STE100 rules for all technical documentation, Markdown files (README, architecture guides, changelogs, development plans, specs, ADRs), and code comments.

---

## Non-Negotiable Rules

1. **Zero Em Dashes and Zero En Dashes**:
   - Never use em dashes or en dashes under any circumstance.
   - For introductions and definitions: Use a colon (`:`).
   - For parenthetical clarifications: Use parentheses `(...)`.
   - For secondary thoughts: Split into two separate sentences.
   - For ranges: Use `to` or `through` (e.g. `35% to 100%`, `Layers 1 through 153`).
   - For compound modifiers: Use a standard ASCII hyphen (`-`).
2. **Strict Sentence Length Limits**:
   - **Procedural / Instructional sentences**: Maximum **20 words**.
   - **Descriptive sentences**: Maximum **25 words**.
   - **Paragraph length**: Maximum **6 sentences** per paragraph.
3. **One Action or Topic per Sentence**:
   - Do not combine multiple instructions with `and` or `then`.
   - Express only one technical fact per sentence.
4. **Active Voice and Imperative Mood**:
   - Write in active voice. Make the subject explicit.
   - Start instructions with base-form imperative verbs (`Run`, `Press`, `Click`, `Install`).
5. **Simple Verb Tenses Only**:
   - Use simple present, simple past, and simple future.
   - Avoid progressive forms (`-ing` as main verb: `is running` -> `runs`).
   - Avoid perfect tenses (`has been added` -> `was added`).
6. **Restrict Noun Clusters**:
   - Maximum 3 consecutive nouns without a preposition.
7. **Approved Vocabulary**:
   - One word = one meaning.
   - Use `use` instead of `utilize` or `leverage`.
   - Use `show` instead of `display` or `indicate`.
   - Use `start` instead of `initiate` or `commence`.
   - Use `stop` instead of `terminate` or `abort`.
   - Use `change` instead of `modify` or `alter`.
   - Use `send` instead of `transmit` or `dispatch`.
   - Use `to` instead of `in order to`.
   - Use `because` instead of `due to the fact that`.
   - Zero marketing buzzwords (`seamless`, `robust`, `blazing fast`, `state of the art`).

---

## Detailed Guidelines and Vocabulary Reference

For the complete word replacement dictionary and grammar rules, see [references/rules.md](./references/rules.md).

---

## Verification

Run the bundled Python linter on any target Markdown file:

```bash
python3 skills/asd-ste100/scripts/lint_ste100.py <target-file.md>
```

The linter validates:
- Zero em dashes and zero en dashes.
- Zero semicolons.
- Sentence word counts (<= 20 for procedural/lists, <= 25 for descriptive).
- Table cell word counts (<= 25 words).
- Non-STE words (`utilize`, `in order to`, `as well as`, `seamless`).

---

## Invocation

Load this skill when:
- Writing or editing technical documentation, READMEs, changelogs, architecture guides, ADRs, or development plans.
- Writing or reviewing code comments.
- Auditing Markdown files for technical clarity.
- User mentions "STE", "STE100", "ASD-STE100", or "Simplified Technical English".
