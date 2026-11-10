# Playbook Sources

Condensed from public winner writeups, organizer guides, and rubrics. Treat these as hypotheses, not laws.

## Tactics That Recur

| Tactic | Effect | Source |
|---|---|---|
| Write the demo first, build backward | Scope shrinks to the recorded path | MIT LLM winner, samanvya.dev |
| One end-to-end path, seeded data, no auth | Removes judge setup failures | MLH judging guide |
| Name one user and one decision | Moves the entry from tech demo to purpose | Anthropic and OpenAI winner lists |
| Treat the video as the submission | Forces narrative and timing | Devpost judging tips |
| Clear the pass-fail gate visibly | Avoids elimination before scoring | Meta event page, Devpost |
| Make the repo judge-runnable | Removes "cannot verify" losses | OpenAI Devpost, Meta checklists |
| Demo one failure or rejection path | Shows depth and a memorable moment | Deriv KYC winner, MIT winner |
| Put one number on screen | Converts adjectives into evidence | BCI winner writeup |
| Iterate against a public eval set | Stops polish on unscored components | Climate agent writeup |

## Three Popular Tactics That Do Not Hold

1. **Be first with a never-before-seen idea.** Originality is one criterion among four in most rubrics. Novelty is also hard to verify in three minutes. A fresh angle on a known workflow is safer.
2. **Stack more models and tools.** No rubric scores tool count. Completion, purpose, and usability dominate. More technologies correlated with project continuation, not with winning.
3. **Perfect the deck and business plan.** Presentation is 10 to 25 percent of most rubrics. Judges want a working demo. TAM slides consume the seconds that should prove the product.

## Five Failure Modes

1. Scope exceeds the clock. Teams split into parallel features and finish none.
2. Video, deployment, and submission left to the last hour.
3. Tech-first build with no named user.
4. Missing mechanical requirements: private repo, login wall, required API not visible, over-length video, undisclosed prior work.
5. Fragile live dependencies with no fallback.

## The Solo First-Six-Hours Move

Record a 2:30 demo of the product you intend to have, with mocked data, before you build it.

- Hour 0 to 1: extract every rubric row and pass-fail gate into one page.
- Hour 1 to 2: name one user and one decision. Write six shots: problem, product, core action, failure case, one number, next step.
- Hour 2 to 4: build a walking skeleton with seeded data and no auth.
- Hour 4 to 6: record a rough voiceover, time it, and list every gap between the words and the runtime.

Play it for a stranger. Ask them to restate the user, the problem, and the number. If they cannot, the script is wrong, not the code.

The recording is also the fallback video when the live demo fails.
