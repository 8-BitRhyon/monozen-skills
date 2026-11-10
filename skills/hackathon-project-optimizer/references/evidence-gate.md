# Evidence Gate

> A judge scores what you can prove, not what you built. Prove it against something you did not make.

## Contract

- Input: a candidate idea, the access you already have, and the demo you intend to record.
- Output: `EVIDENCE.md` with four fields filled before code.
- Stop: ground truth, baseline, holdout, and threshold are named and reachable without a partner.
- Kill: any field needs an asset you cannot obtain by day 2. Change the idea, not the schedule.

## The Four Fields

| Field | Question | Fail condition |
|---|---|---|
| Ground truth | What independent reference decides if you are right? | Only your own fixtures |
| Baseline | What does the naive alternative score on the same set? | No comparison |
| Holdout | What data is locked before tuning? | Tuned on everything |
| Threshold | What number did you commit to before the run? | Target chosen after results |

A project with all four is demo-ready. A project with three is a claim. A project with two is a pitch.

## 1. Ground Truth

Independent means the label was not produced by the system under test. Rank sources:

1. External benchmark with published labels.
2. Public dataset with an independent curator.
3. Physical measurement or sensor ground truth.
4. Manufacturer specification or regulatory text.
5. Human expert label, blind to your output.
6. Your own fixtures. This is a smoke test, not evidence.

Check access on day 1: is it public, free, and downloadable today? If the evidence needs a merchant, a customer, a partner, or an approval you do not control, treat that as a red flag on the idea, not a task for later.

### What winners used

| Entry | Ground truth | What the demo showed |
|---|---|---|
| ControlAnything | Real hardware acknowledgements (881 gimbal moves, 100/100 commands) | Devices responding live |
| Gatekeeper | OSV, GitHub, and npm confirmations (48 packages), time-split test set | Malware blocked at install |
| David Barry | Ontario Building Code | A basement becomes a legal unit |
| Aurora | Held-out simulation scenarios (falls 27.5% to 13.5%) | A robot survives a push |
| Video2URDF | RBO motion capture benchmark and maker specs | A robot opens the measured drawer |
| Consai | Inspector-labeled walks with a holdout room | A punch list with photo proof |
| Formwright | Design rule checks, a virtual board, live part stock | A board whose firmware runs |
| ORCA | Deterministic geometry engine as an oracle | A clash resolved in 3D |
| Voluma Bio | Lab manual tracing (within 1.3%) | A measurement with a paper trail |
| Kroonen AI | 170,000 steering tests | A concept dial that works |

Ten of ten compare against something the builder did not author. That is the pattern, not the polish.

## 2. Baseline

The judge's first thought is "couldn't I just prompt a model?" Build that version and run it on the same set.

- Video2URDF asked Muse Spark plainly for a URDF, five answers per object, and reported where it fails.
- Gatekeeper compared against static rules, TF-IDF plus logistic regression, and two Llama Guard variants.
- A baseline costs hours, not days, and it converts an assertion into a measurement.

Report the baseline beside your system, on the same rows, with the same metric.

## 3. Holdout

Split before tuning. Lock the split. Do not look at it.

- Consai recorded a third walk in a different room and never tuned on it.
- Gatekeeper used a time split, deduplicated campaign clusters, and scored the test set once.
- Aurora measured on fixed held-out scenarios.

Report the tuned set and the holdout separately. If you tuned on everything, say so and label the result a smoke test.

## 4. Threshold

Write the number before the run: recall at least 0.90, axis error at most 2 degrees, 100% of false claims caught.

- Video2URDF pre-registered a bar and recorded a miss when it did not clear it.
- Consai set targets per metric before tuning and reported that every target was met.
- A missed threshold with a clear number reads as rigor. A vague success reads as marketing.

## Sample Size

- 12 of 12 is noise. State what one miss would move.
- Consai: one miss moves the first walk by 8 points and the holdout by 50.
- Gatekeeper: 212 malicious and 590 benign packages, with 95% confidence intervals.
- Below 30 labeled cases, call it a smoke test in the README and in the film.

## The Demo Consequence

- The number beat in the film must show the comparison on screen: your system and the baseline, same input.
- Show the naive approach failing next to yours. That contrast is the argument.
- Name the misses in the video, not only in the README. Judges reward disclosed failure more than a clean claim.

## Failure Taxonomy

- **Fixture-only evidence:** the system proves itself against data it generated.
- **Baseline-free claim:** a number with nothing to compare it to.
- **Tuned-on-test:** no holdout, so the result is inflated by construction.
- **Post-hoc threshold:** the target was chosen after seeing the score.
- **Partner-blocked ground truth:** the evidence cannot exist without a third party.
- **Self-referential oracle:** the checker shares code or assumptions with the system.

## Case Study: An Execution Auditor

An agent promised refunds, and the tool reconciled those promises against a ledger. It shipped 235 tests, signed receipts, idempotency under concurrency, a 180-second film, and a 12-case eval at 12 of 12.

It did not place, out of 5,367 entries. The build was not the gap. The evidence was:

- The 12 cases were authored alongside the system, so they proved the pipeline ran, not that the gap was real.
- There was no baseline. The obvious alternative, asking a model to read the transcript and say whether the refund happened, was never run.
- There was no holdout, no pre-registered threshold, and n was far below 30.
- The ground truth was a mock ledger the builder wrote.

The fix was cheap and available on day 2. Run the naive baseline on the same cases. The model reads the agent's own claim and agrees with it, while the ledger says zero. That single contrast is the demo, and it needs no merchant.

Lesson: the missing asset was a labeled benchmark with a baseline, not a customer.

## Gate Question

> Can I obtain ground truth, a baseline, and a holdout without a partner by day 2?

If the answer is no, pick another idea. If the answer is yes, write `EVIDENCE.md` and start building.
