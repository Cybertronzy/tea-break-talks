import {staticFile} from 'remotion';
import type {DialogueLine} from '../DialogueVideo';
import content from './dam.content.json';
import timings from './dam.timings.json';

// Pair 4 — Teal & Terracotta
export const damColors = {
	colorA: '#2E6E6E',
	colorB: '#C1663A',
};

// The actual words live in dam.content.json (shared with the Python voice
// generator). dam.timings.json is regenerated from the real audio length
// every time scripts/generate_audio.py runs — the numbers checked in here
// are just a safe fallback so the project still renders before that's run.
export const damLines: DialogueLine[] = content.lines.map((line, i) => ({
	speaker: line.speaker as 'A' | 'B',
	text: line.text,
	durationInFrames: timings[i] ?? 90,
	audioSrc: staticFile(`audio/dam/line-${i}.mp3`),
}));
