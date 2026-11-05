# Film Pipeline

Detailed recipe for the `product-film` skill. Keep the film a timed argument: one problem, one proof path, one close.

## Beat Map

Use a six-beat structure for a 3:00 film. Word counts assume 135-145 words per minute.

| Beat | Time | Words | Read time | Screen time |
|---|---|---:|---:|---:|
| Hook | 0:00-0:20 | 35-40 | 15-17s | 3-5s |
| Pain | 0:20-0:45 | 52-58 | 22-24s | 1-3s |
| Demo A | 0:45-1:30 | 80-90 | 33-37s | 8-12s |
| Demo B | 1:30-2:15 | 80-90 | 33-37s | 8-12s |
| Numbers | 2:15-2:45 | 60-68 | 25-28s | 2-5s |
| Vision | 2:45-3:00 | 25-30 | 11-13s | 2-4s |

If one beat is near 76 wpm and another near 134, the read will feel broken even when every beat fits. Rebalance the words before recording.

## Script Rules

- Write for the mouth. Short sentences. One idea per line.
- Use the screen for labels, JSON, table rows, and exact figures. The narrator explains why the screen matters.
- Replace jargon with the plain action: "a separate check compares the promise to the ledger" beats "deterministic reconciliation."
- Keep the model's limits visible. Say "modeled, not measured" when the number is a projection.
- Put `[pause]` on its own line in the read script. Do not put it in the VO string that TTS reads.
- Run a read-aloud test. If a sentence needs a breath in the middle, split it.

## Storyboard Shape

`templates/storyboard.ts` is the timing contract. Each scene needs:

- `id`, `beat`, `start`, `duration`, `mode`, `tone`, `vo`, `cues`.
- Cues with `at`, `hold`, `kind`, `text`, `sub`, optional `label`, `facts`, `tone`.
- `vo` is the spoken words only. The read script carries pauses and delivery notes.

Keep total duration at 180.0 seconds and FPS at 24.

## Render

A proven stack:

1. Vite or a static HTML page builds the scenes.
2. GSAP creates a paused timeline.
3. Playwright seeks the timeline frame by frame and screenshots.
4. ffmpeg receives JPEG frames on stdin and writes H.264, yuv420p, 1920x1080, 24 fps.

```bash
npm run build
npm run render
```

Rules:

- Delete or rename the old output before rendering.
- Never run two renders against the same output. Two ffmpeg processes corrupt the MP4 and the `moov` atom.
- If a render is interrupted, delete the partial file and render again. Do not mux a partial file.
- Capture real product states with Playwright. Use test or sample data, and label it on screen.

## Capture Real States

- Prefer a deterministic capture script over manual screenshots.
- Wait for `document.fonts.ready` before taking a screenshot.
- Capture the actual card or panel, not a full page with unrelated chrome.
- Hide loading, empty, and error states unless the film is about them.
- Never fabricate a product state in HTML. If the app cannot produce it, the film does not show it.

## Human Voiceover

### Inspect the take

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,sample_rate,channels -of json take.m4a

ffmpeg -hide_banner -i take.m4a \
  -af silencedetect=noise=-35dB:d=0.8 -f null - 2>&1 \
  | grep -E "silence_(start|end)"
```

Map the silence gaps to the six beat boundaries. If the beat starts do not line up, do not mux the full take. Split at the gaps and place each segment at its scene start.

### Align the beats

Use `scripts/align_voiceover.py` with a beat JSON:

```json
[
  {"name": "hook", "start": 1.00, "end": 19.09, "delay": 0, "tempo": 1.0},
  {"name": "pain", "start": 20.71, "end": 44.75, "delay": 20, "tempo": 1.0},
  {"name": "demo-a", "start": 46.83, "end": 83.19, "delay": 45, "tempo": 1.0}
]
```

`start` and `end` are seconds in the source take. `delay` is the scene start in the film. `tempo` above 1.0 tightens a beat that overruns. Keep it at 1.2 or less.

```bash
python3 scripts/align_voiceover.py \
  --input take.m4a \
  --beats beats.json \
  --output voiceover-aligned.wav
```

### Normalize and mux

Put stereo before `loudnorm`. If you normalize mono and then duplicate it to stereo, the integrated loudness rises by about 3 dB and the result can clip.

```bash
ffmpeg -y -i silent-master.mp4 -i voiceover-aligned.wav \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -t 180 \
  -movflags +faststart human-cut.mp4
```

Targets:

- Integrated loudness: about -16 LUFS.
- True peak: -2.0 dBFS or lower.
- AAC sample peak: below 0 dBFS. A 0.0 dB peak means re-mux with more headroom.

Check each beat:

```bash
ffmpeg -ss 2 -t 10 -i human-cut.mp4 -af volumedetect -f null - 2>&1 \
  | grep -E "mean_volume|max_volume"
```

## Verify Before Upload

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_type,duration,nb_frames -of json human-cut.mp4
```

- Duration exactly `180.000` or your target.
- Video `4320` frames at 24 fps for 180 seconds.
- Audio duration equals the video duration.
- Every beat has signal. The tail is silent.
- No `0.0 dB` peaks.
- Download the release asset and probe it again. Do not trust the local file alone.

## Common Failures

- Two render processes: corrupt output, missing `moov` atom.
- Shell sandbox blocks Chromium or Mach services: run the browser and `say` steps in a Herdr pane outside the sandbox.
- Full take muxed without alignment: audio drifts ahead of the visuals.
- Mono normalized then duplicated to stereo: +3 dB and clipping.
- AAC peak at 0.0 dB: lower the ceiling and re-mux.
- YouTube shows 3:01 for a 180.0 file: player rounding. Trust `ffprobe`; use a 179.0s cut if a form rejects the display.
- Thumbnail text generated by an image model: misspellings and artifacts. Render exact text in HTML/CSS instead.

## Workflow

Use the repo's work harness when it exists:

- `/work` is the primary loop. `/goal`, `/plan`, and `/teamwork` are explicit operations inside the same state.
- One captain owns the film. One writer per file. Give each worker a self-contained brief with a verify command.
- Keep the script, storyboard, and voiceover captain-owned. Parallelize only independent assets.

When the OpenCode shell sandbox blocks Chromium, DNS, LaunchServices, or Mach services:

- Run browser, `say`, GitHub, and release steps in a Herdr pane outside the sandbox.
- Confirm the pane is outside the sandbox with a browser smoke test before rendering.
- Keep the render pane alive until the MP4 is verified. Do not start a second render.

Ship the film like code:

- Branch, PR, green CI, merge, then move the submission tag.
- Upload the film to the release asset and download it again. Probe the downloaded file, not only the local one.
- Keep the silent master and the raw voice take. They are the recovery path.
- Update the form and YouTube description after the tag moves. Stale counts are a credibility leak.

Build the post kit from the same proof hierarchy. One story, one measured number, one link, one honest limit.
