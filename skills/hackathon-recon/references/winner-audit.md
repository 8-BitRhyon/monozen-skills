# Winner Audit: Seven Repositories

Source: winning entries from the Meta Global AI Developer Hackathon, Indie and Startup tracks. The audit reads repositories and READMEs, not pitch copy.

## Evidence Fields

| Repo | Ground truth | Baseline | Holdout | Threshold | n | No-key replay |
|---|---|---|---|---|---|---|
| controlanything | Hardware acknowledgements | No | No | No | 6 demos | Yes (fixture) |
| gatekeeper | OSV, GitHub, npm | Static rules, TF-IDF, Llama Guard | Time split | Yes | 212 + 590 | Yes |
| video2urdf | RBO motion capture, specs | Same model, no tools | RBO and 3 unseen objects | No | 13 videos | Yes |
| formwright | LCSC data, DRC | No | No | No | 1 run | No |
| punchwalk | Inspector labels, blind rater | Grounding v1 | Walk 3 | Yes | 26 items | Yes ($0 cache) |
| glimmer-scope | Steering grades | No | No | No | 519,383 features | No |
| voluma | Expert-corrected lines | Untrained SAM 3.1 | 2 test, 4 validation | Yes | 6 scans | No |

Five of seven ship a no-key replay. Four of seven name a baseline. Four of seven lock a holdout. Three of seven pre-register a threshold.

## Three Conventions In Six Of Seven

1. **Provenance block.** A "built during the hackathon" section with dates and the first commit. Two name the exact hash. One names both an empty first commit and the first content commit.
2. **Model-to-job table.** One row per model and the decision it makes. Five of seven.
3. **Live link and quickstart near the top.** A demo, space, or video within the first 25 lines, followed by runnable commands. Six of seven.

## Two Behaviors Normal READMEs Do Not Have

- **A scoreboard with targets fixed before scoring.** `punchwalk` has a `Target` column and states that every target was set before tuning. `gatekeeper` fixes thresholds on training data before scoring the test set once. `voluma` states the cut rule was fixed on validation scans.
- **An argument against their own headline.** `video2urdf` says its checks passed means only that no automatic check objected. `punchwalk` says one miss moves the holdout recall by 50 points. `gatekeeper` lists every miss and notes that OSV dates are often backdated.

## The Shortest Credible Evidence Section

One external label source, one holdout, one table. About 30 rows and one offline command.

1. Name the ground truth and who produced it.
2. Put n in the table header.
3. Add a naive baseline row that any reader can reproduce.
4. Freeze one holdout before tuning, and say so.
5. Report per-metric results plus the miss analysis and the small-n caveat.
6. Ship a no-key replay of the measurement.

## How To Use This In Recon

- Score a candidate entry on the fields above.
- Treat five of seven fields as the bar for a software entry.
- If a winner lacks most fields, it probably won on hardware, novelty, or a live physical consequence. Check before copying its structure.
- Copy the convention, not the stack.
