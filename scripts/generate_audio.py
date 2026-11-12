#!/usr/bin/env python3
"""
Generates the voice-over for one script using edge-tts (free, no API key —
see README for why we picked it) and writes two things:

  1. public/audio/<script>/line-N.mp3   — one voice clip per dialogue line
  2. src/scripts/<script>.timings.json  — how many video frames each line
                                           should last, measured from the
                                           *actual* length of its own clip

DialogueVideo.tsx then plays each clip inside its matching Sequence, so the
speech bubble and the voice always line up, however long a line turns out
to be read aloud.

Usage:
    python3 scripts/generate_audio.py dam

This reads src/scripts/dam.content.json and writes the two outputs above.
Run it once before `npx remotion render` — the GitHub Actions workflow
already does this automatically.
"""

import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

FPS = 30
# Extra beat of silence after each line, so the bubble doesn't vanish the
# instant the voice stops — matches the fade-out the bubble already has.
TAIL_PADDING_FRAMES = 20
# Never let a line's on-screen time drop below this, even if the voice
# clip itself is very short (e.g. a one-word line like "The dam.").
MIN_DURATION_FRAMES = 45

ROOT = Path(__file__).resolve().parent.parent


def get_audio_duration_seconds(mp3_path: Path) -> float:
	"""Reads an mp3's duration using ffprobe (ships with ffmpeg)."""
	result = subprocess.run(
		[
			"ffprobe",
			"-v", "error",
			"-show_entries", "format=duration",
			"-of", "default=noprint_wrapper=1:nokey=1",
			str(mp3_path),
		],
		capture_output=True,
		text=True,
		check=True,
	)
	return float(result.stdout.strip())


async def generate_line(text: str, voice: str, out_path: Path) -> None:
	communicate = edge_tts.Communicate(text, voice)
	await communicate.save(str(out_path))


async def main(script_name: str) -> None:
	content_path = ROOT / "src" / "scripts" / f"{script_name}.content.json"
	content = json.loads(content_path.read_text())

	audio_dir = ROOT / "public" / "audio" / script_name
	audio_dir.mkdir(parents=True, exist_ok=True)

	voices = {"A": content["voiceA"], "B": content["voiceB"]}
	timings = []

	for i, line in enumerate(content["lines"]):
		out_path = audio_dir / f"line-{i}.mp3"
		voice = voices[line["speaker"]]
		print(f"  [{i}] ({line['speaker']}/{voice}) {line['text'][:50]!r}")
		await generate_line(line["text"], voice, out_path)

		duration_s = get_audio_duration_seconds(out_path)
		frames = max(
			MIN_DURATION_FRAMES,
			round(duration_s * FPS) + TAIL_PADDING_FRAMES,
		)
		timings.append(frames)

	timings_path = ROOT / "src" / "scripts" / f"{script_name}.timings.json"
	timings_path.write_text(json.dumps(timings))
	print(f"Wrote {len(timings)} clips to {audio_dir}")
	print(f"Wrote timings to {timings_path}")


if __name__ == "__main__":
	if len(sys.argv) != 2:
		print("Usage: python3 scripts/generate_audio.py <script-name>")
		sys.exit(1)
	asyncio.run(main(sys.argv[1]))
