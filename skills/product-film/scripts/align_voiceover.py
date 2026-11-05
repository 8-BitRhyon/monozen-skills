#!/usr/bin/env python3
"""Align a full voiceover take to fixed film beat starts.

The input is one full take. The beats file is JSON:

[
  {"name": "hook", "start": 1.00, "end": 19.09, "delay": 0, "tempo": 1.0},
  {"name": "pain", "start": 20.71, "end": 44.75, "delay": 20, "tempo": 1.0}
]

`start` and `end` are seconds in the source. `delay` is the film start in
seconds. `tempo` above 1.0 tightens a beat that overruns; keep it at 1.2 or
less. The output is a stereo WAV at the requested duration, normalized to the
requested loudness and true peak.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Align a voiceover take to film beats.")
    parser.add_argument("--input", required=True, help="Full voiceover take.")
    parser.add_argument("--beats", required=True, help="JSON list of beat ranges.")
    parser.add_argument("--output", required=True, help="Aligned stereo WAV.")
    parser.add_argument("--duration", type=float, default=180.0, help="Film duration in seconds.")
    parser.add_argument("--loudness", type=float, default=-16.0, help="Integrated LUFS target.")
    parser.add_argument("--true-peak", type=float, default=-2.0, help="True peak ceiling in dBFS.")
    parser.add_argument("--sample-rate", type=int, default=48000)
    parser.add_argument("--workdir", default=None, help="Segment cache. Defaults next to the output.")
    parser.add_argument("--keep-segments", action="store_true", help="Keep extracted beat WAVs.")
    args = parser.parse_args()

    source = Path(args.input).expanduser()
    beats_path = Path(args.beats).expanduser()
    output = Path(args.output).expanduser()
    if not source.exists():
        raise SystemExit(f"Missing input: {source}")
    if not beats_path.exists():
        raise SystemExit(f"Missing beats file: {beats_path}")

    beats = json.loads(beats_path.read_text())
    if not isinstance(beats, list) or not beats:
        raise SystemExit("Beats file must be a non-empty JSON list")

    workdir = Path(args.workdir).expanduser() if args.workdir else output.parent / "vo-aligned"
    workdir.mkdir(parents=True, exist_ok=True)

    segments = []
    for index, beat in enumerate(beats):
        name = str(beat.get("name", f"beat-{index}"))
        start = float(beat["start"])
        end = float(beat["end"])
        delay = float(beat.get("delay", 0))
        tempo = float(beat.get("tempo", 1.0))
        if end <= start:
            raise SystemExit(f"{name}: end must be greater than start")
        if delay < 0 or delay >= args.duration:
            raise SystemExit(f"{name}: delay must be between 0 and {args.duration}")
        if tempo < 0.5 or tempo > 2.0:
            raise SystemExit(f"{name}: tempo must be between 0.5 and 2.0")
        target = workdir / f"{index:02d}-{name}.wav"
        filters = f"atrim=start={start}:end={end},asetpts=PTS-STARTPTS"
        if abs(tempo - 1.0) > 0.001:
            filters += f",atempo={tempo}"
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(source),
                "-af",
                filters,
                "-ac",
                "1",
                "-ar",
                str(args.sample_rate),
                "-c:a",
                "pcm_s16le",
                str(target),
            ]
        )
        actual = duration(target)
        segments.append((name, target, delay, actual))
        print(f"{name:12s} {actual:6.2f}s  delay {delay:6.1f}s  tempo {tempo:.2f}")

    silence = workdir / "silence.wav"
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"anullsrc=r={args.sample_rate}:cl=mono",
            "-t",
            str(args.duration),
            "-c:a",
            "pcm_s16le",
            str(silence),
        ]
    )

    inputs = ["-i", str(silence)]
    for _, segment, _, _ in segments:
        inputs += ["-i", str(segment)]

    filters = []
    mix = ["[0:a]"]
    for index, (name, _, delay, _) in enumerate(segments, start=1):
        filters.append(f"[{index}:a]adelay={round(delay * 1000)}:all=1[a{index}]")
        mix.append(f"[a{index}]")
    filters.append(
        "".join(mix)
        + f"amix=inputs={len(segments) + 1}:duration=first:normalize=0,"
        + f"atrim=0:{args.duration},pan=stereo|c0=c0|c1=c0,"
        + f"loudnorm=I={args.loudness}:TP={args.true_peak}:LRA=11,"
        + f"aresample={args.sample_rate}[aout]"
    )

    run(
        [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[aout]",
            "-ac",
            "2",
            "-ar",
            str(args.sample_rate),
            "-c:a",
            "pcm_s16le",
            str(output),
        ]
    )

    print(f"wrote {output}")
    print(f"duration {duration(output):.2f}s")
    if not args.keep_segments:
        for _, segment, _, _ in segments:
            segment.unlink(missing_ok=True)
        silence.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
