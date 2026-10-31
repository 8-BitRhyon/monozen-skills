---
name: marketing-copy
description: "Writes and edits public marketing copy with a voice sample, claim support, and a de-AI pass. Covers landing pages, launch posts, emails, comparisons, and docs-as-marketing. Use when drafting or reviewing public copy."
---

# Marketing Copy

> Specific beats clever. A claim without proof is noise, and a sentence a competitor could publish unchanged is not positioning.

## Contract

- Input: `MARKETING.md`, `POSITIONING.md`, and 2-3 paragraphs of the founder's real writing.
- Output: copy plus a claim ledger.
- Stop: every claim has evidence, and a stranger can repeat the value after one read.

## 1. Diagnose Before Drafting

Pick one mode:

- **Blank brief:** write from MARKETING.md and POSITIONING.md.
- **Existing voice:** preserve the author's cadence and edit only the weak parts.
- **Point edit:** change the named sentence or section, nothing else.

State the mode before writing. Do not rewrite a voice sample into generic marketing.

## 2. Extract Voice

From the sample, record:

- sentence length and rhythm
- vocabulary the author actually uses
- banned words and forced phrases
- how they open and close

Write to that, not to a brand archetype.

## 3. Structure

1. Outcome in the first line.
2. Mechanism in the second.
3. Proof in the third.
4. Call to action last.

For a landing page: one primary action, one proof block, one honest comparison, one pricing number. For a launch post: problem, demo, what changed, what is still missing.

## 4. Claim Ledger

For each number, customer, comparison, or guarantee, record the evidence and its date. If there is no evidence, cut the claim or mark it as a hypothesis. Never invent a customer, metric, or benchmark.

## 5. De-AI Pass

- Ban: delve, seamless, robust, unlock, elevate, supercharge, game-changer, revolutionize, in today's fast-paced.
- Ban triads and "not just X, but Y".
- No em dashes.
- Vary sentence length. Use concrete nouns and verbs.
- Swap test: if a competitor could publish it unchanged, rewrite it.
- Read it aloud. If it sounds like a pitch deck, cut.

## 6. Docs As Marketing

- README first line: what it is, who it is for, one command.
- Quickstart under 5 minutes.
- Comparison pages honest about where you lose.
- Answer-shaped pages for real queries.
- `llms.txt` and clean docs structure for AI answer engines.
- Mentions in other people's videos, threads, and roundups beat schema markup.

## Anti-Patterns

- Feature lists.
- "AI-powered" as the claim.
- Fake urgency and countdowns.
- Gated ebooks and webinars.
- Walls of text with no proof.
- Copy that sounds like every other agent tool.

## Artifacts

- [COPY.md](../../marketing/templates/COPY.md)
- Sources: [references/sources.md](references/sources.md)

## Invocation

Load when:

- Drafting or editing a landing page, launch post, email, or comparison.
- Copy sounds generic or AI-generated.
- A claim needs evidence before it ships.
