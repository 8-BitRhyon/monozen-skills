# Submission Kit

The film is one asset. The submission also needs a title, description, thumbnail, tags, duration check, and a form copy that matches the repo.

## Title

For a hackathon, put the product name first. The judge should know what they are looking at before the hook.

Patterns:

- `Product: The problem in one sentence. Did the outcome happen?`
- `Product: The old way versus the new fact.`
- `Product: What the demo proves.`

Keep it under 70 characters. Do not add `| Product` at the end when the product already leads.

## Description

The first two lines are visible before "Show more." Put the problem there.

```text
The agent said the refund was processed. The ticket closed. The ledger says $0.00 moved.

Product is the one-line description. This is the 3-minute cut, built for [event].

WHAT YOU ARE WATCHING
0:00 The hook
0:20 The cost
0:45 The core
1:30 The fix
2:15 The proof
2:45 The vision

THE PROOF
Tier 1, live and read-only: the measured result, the scope, and what did not happen.
Tier 2, labeled eval: exact counts and the size of the set.
Tier 3, modeled not measured: the projection, the assumptions, and the sentence "not a guarantee or a merchant result."

TRY IT
Sample: [no-install link]
15-second proof: [link]
Receipt or verification clip: [link]
Code: [repo]

MODEL
[model id and serving path]

[Test counts]. Synthetic fixtures and test ledgers only. No merchant data.

#Tag1 #Tag2 #Tag3
```

Rules:

- Put the 15-second proof link in the description when the form asks for it.
- Use the same counts as CI and the README. Stale counts are a credibility leak.
- Label every modeled number. Never let a projection read as a measurement.
- Keep the first three hashtags specific. They appear above the title.
- Do not paste internal notes, agent briefs, or private paths.

## Tags And Category

- Category: Science & Technology for a software or AI product film.
- Tags: product name, category, problem, integrations, model, event. About 20 tags, under 500 characters.
- Audience: not made for kids. A B2B product film is not directed to children.
- Visibility: Public or Unlisted. Unlisted is enough for a judge with the link.

## Thumbnail

- 1280x720, under 2 MB.
- One number contrast, one brand mark, one line.
- Exact text. Render HTML/CSS with Playwright; do not let an image model spell the headline.
- Check at 320x180. If the headline is unreadable there, cut words.
- Keep the thumbnail claim consistent with the film. Do not show a number the film never proves.

## Duration

- YouTube can display `3:01` for a file whose container is exactly `180.000`.
- Check the file with `ffprobe`. Do not trust the player label.
- If a form or rule rejects the display, render a `179.0s` cut by shortening the final hold. Do not cut a beat.
- A strict validator usually reads the file, not the player label. State the actual duration in the form notes if there is a field.

## Form Audit

Before submit:

- Repo link resolves and the submission tag points to the intended commit.
- Video link resolves and the title and thumbnail are live.
- Every count in the form matches CI and the README.
- The live proof says `read-only`, `test-mode`, and `no money moved`.
- Tier 3 is labeled `modeled, not measured`, with the 4.0% failure rate called an assumption.
- No `hardware-in-the-loop`, `133,000/sec`, or `0.007 ms` claims remain.
- The 15-second proof is in the video description.
- The form character count is under the limit after the edits.

## Post Kit

Build posts from the same proof hierarchy, not from a separate pitch.

- One story: the promise versus the ledger.
- One number: the cleanest measured catch.
- One link: the sample or the film.
- One lesson: what the build changed in how you work.
- One honest limit: what is modeled, mocked, or still missing.

Useful formats:

- Short announcement: problem, product, one proof point, link.
- Build log: the workflow change, the hard part, the thing you cut.
- First-submission reflection: what surprised you, what you would do differently.
- Demo clip post: 15 seconds of the product doing the thing, no voiceover needed.

Do not claim a win, a customer, or merchant savings. Do not post a number that is not in the claim ledger.
