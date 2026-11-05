# Intake

The film brief is mostly derivable. Read first, fill the gaps, then ask only for the decisions the repo cannot answer.

## Read First

- `README.md` and the public landing page: category, one-line problem, proof hierarchy.
- `docs/research/*claims*` or the claim ledger: measured, borrowed, modeled, and forbidden claims.
- CI configuration or the latest test run: exact check counts.
- Film or brand CSS: colors, fonts, logo, motion rules.
- Existing film, screenshots, and release assets: what can be reused.
- Event page or submission form: runtime, format, deadline, required links, track.
- Model configuration: exact model ID and serving path.

## Fill From Context

| Brief field | Default source |
|---|---|
| Product name | README title or landing logo |
| One-line problem | Landing H1 or first paragraph |
| Hero proof | The first tier the landing page leads with |
| Measured claims | Claim ledger rows marked measured |
| Modeled claims | Claim ledger rows marked modeled; keep the assumptions |
| Test counts | CI or README, not an older draft |
| Brand tokens | Landing or film CSS variables |
| Model ID | README, env example, or client config |
| Runtime and format | Event rules; default 3:00, 16:9, 24 fps |
| Title direction | Landing H1, brand first |
| Thumbnail headline | The sharpest measured contrast, not a projection |

## Ask Only If Missing

Ask these as a compact batch. Offer a default for each.

1. **Runtime and format.** Default: 3:00, 16:9, 24 fps. Ask only if the event has a different limit or wants vertical.
2. **Narrator.** Default: the founder's name and voice. Ask if the film should use a synthetic scratch first or wait for the human take.
3. **Hero proof.** Default: the first tier in the claim ledger. Ask if the story should lead with the live catch, the labeled eval, or the modeled fleet.
4. **Audience.** Default: judges and technical buyers. Ask if it is a customer launch, a investor cut, or a social clip.
5. **Publish target.** Default: YouTube and the submission form. Ask for the required links and whether the video must be public or unlisted.
6. **Claims that cannot ship.** Ask for legal, customer, or partner constraints. If a number lacks evidence, cut it or label it modeled.
7. **Brand assets.** Ask only if the repo has no logo, colors, or fonts.
8. **Thumbnail headline.** Offer 2-3 exact options derived from the proof. Ask which one, or default to the sharpest measured contrast.
9. **Deliverables.** Default: silent master, synthetic preview, human cut, thumbnail, YouTube copy. Ask if they also need a 15-second proof or a receipt clip.

## Brief Confirmation

Before scripting, write a short brief and ask for a yes:

```text
Film brief
- Product: [name]
- Audience: [who]
- Runtime: [3:00, 16:9]
- Hero proof: [tier and number]
- Claims to avoid: [list]
- Narrator: [name or synthetic scratch]
- Publish: [YouTube / form / both]
- Deliverables: [silent, preview, human, thumbnail, copy]
- Open questions: [only the real ones]
```

If the user says "you decide," use the defaults above and state the assumptions in one line. Do not ask again for facts the repo already contains.

## Stop Conditions

Do not start the script until these are known or defaulted:

- Runtime and aspect ratio.
- Hero proof.
- Narrator and voiceover path.
- Publish target and required links.
- Any claim that cannot be verified.

Do not start the render until the script passes the density check and the human voiceover (or a deliberate synthetic scratch) is available.
