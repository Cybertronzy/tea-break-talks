import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	Easing,
} from 'remotion';
import {Character} from './Character';
import {SpeechBubble} from './SpeechBubble';

export type DialogueLine = {
	speaker: 'A' | 'B';
	text: string;
	// Path to this line's generated voice-over (see scripts/generate_audio.py).
	// Optional so a script can still be written/previewed before audio exists.
	audioSrc?: string;
	durationInFrames: number;
};

export type DialogueVideoProps = {
	lines: DialogueLine[];
	colorA: string;
	colorB: string;
	seriesTitle?: string;
	// Turns on the flowing river + dam backdrop (see RiverDamScene below) —
	// enabled per-script, since each metaphor gets its own matching backdrop
	// over time rather than one generic scene for all 39 videos.
	riverDam?: boolean;
};

const SeriesTitle: React.FC<{title: string; colorA: string; colorB: string}> = ({
	title,
	colorA,
	colorB,
}) => (
	<div
		style={{
			position: 'absolute',
			top: 150,
			left: 0,
			right: 0,
			textAlign: 'center',
			padding: '0 40px',
		}}
	>
		<div
			style={{
				fontFamily: 'Georgia, "Iowan Old Style", serif',
				fontSize: 68,
				letterSpacing: 10,
				textTransform: 'uppercase',
				color: 'rgba(243, 239, 230, 0.92)',
				textShadow: `0 0 28px ${colorA}66, 0 0 48px ${colorB}44`,
				lineHeight: 1.15,
			}}
		>
			{title}
		</div>
		<div
			style={{
				margin: '26px auto 0',
				width: 220,
				height: 4,
				borderRadius: 2,
				background: `linear-gradient(90deg, ${colorA}, ${colorB})`,
				boxShadow: `0 0 16px ${colorA}99`,
			}}
		/>
	</div>
);

const CHAR_HEIGHT = 960; // half the 1920px-tall canvas
const CHAR_WIDTH = Math.round((CHAR_HEIGHT * 160) / 270);
const EDGE_OVERLAP = Math.round((CHAR_WIDTH * 2 - 1080) / 2); // how far each character bleeds off its screen edge

// The character's head sits near the top of its 160x270 viewBox (top ~ y=12).
// Use that fraction to park the speech bubble just above the head, regardless
// of CHAR_HEIGHT, so "bring it close to the characters" stays true if the
// character size is ever tuned again.
const HEAD_TOP_FRACTION = 12 / 270;
const BUBBLE_GAP_ABOVE_HEAD = 40;
const BUBBLE_BOTTOM = Math.round(
	CHAR_HEIGHT * (1 - HEAD_TOP_FRACTION) + BUBBLE_GAP_ABOVE_HEAD,
);

// Deterministic pseudo-random in [0, 1), seeded by index — Remotion needs
// frame output to be a pure function of frame number, so Math.random() is
// never safe here (it would flicker differently render to render).
const seeded = (seed: number) => {
	const x = Math.sin(seed * 999.7) * 10000;
	return x - Math.floor(x);
};

const STAR_COUNT = 70;

const STARS = Array.from({length: STAR_COUNT}).map((_, i) => ({
	x: seeded(i * 2.17 + 1) * 1080,
	y: seeded(i * 3.71 + 2) * 1920,
	r: 1 + seeded(i * 5.31 + 3) * 2,
	phase: seeded(i * 7.93 + 4) * Math.PI * 2,
	speed: 0.3 + seeded(i * 1.33 + 5) * 0.6,
	baseOpacity: 0.35 + seeded(i * 9.11 + 6) * 0.45,
}));

// A handful of shooting stars, each with a fixed start frame so they repeat
// predictably across the clip instead of feeling random every render.
const SHOOTING_STARS = [
	{start: 35, duration: 28, x1: 90, y1: 180, x2: 430, y2: 420},
	{start: 260, duration: 26, x1: 950, y1: 120, x2: 650, y2: 360},
	{start: 520, duration: 30, x1: 150, y1: 500, x2: 540, y2: 220},
	{start: 760, duration: 26, x1: 900, y1: 480, x2: 600, y2: 220},
	{start: 960, duration: 28, x1: 200, y1: 240, x2: 560, y2: 460},
];

const ShootingStars: React.FC<{frame: number}> = ({frame}) => (
	<>
		{SHOOTING_STARS.map((s, i) => {
			const progress = (frame - s.start) / s.duration;
			if (progress < 0 || progress > 1) return null;
			const x = interpolate(progress, [0, 1], [s.x1, s.x2]);
			const y = interpolate(progress, [0, 1], [s.y1, s.y2]);
			const tailX = interpolate(progress, [0, 1], [s.x1 - 46, s.x2 - 46]);
			const tailY = interpolate(progress, [0, 1], [s.y1 - 16, s.y2 - 16]);
			const opacity = interpolate(
				progress,
				[0, 0.15, 0.75, 1],
				[0, 1, 1, 0],
				{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
			);
			return (
				<g key={i} opacity={opacity}>
					<line
						x1={tailX}
						y1={tailY}
						x2={x}
						y2={y}
						stroke="#ffffff"
						strokeWidth={2.4}
						strokeLinecap="round"
					/>
					<circle cx={x} cy={y} r={2.6} fill="#ffffff" />
				</g>
			);
		})}
	</>
);

const StarField: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
			{STARS.map((s, i) => {
				const twinkle =
					0.5 + 0.5 * Math.sin((frame / fps) * s.speed * Math.PI * 2 + s.phase);
				return (
					<circle
						key={i}
						cx={s.x}
						cy={s.y}
						r={s.r}
						fill="#ffffff"
						opacity={s.baseOpacity * twinkle}
					/>
				);
			})}
			<ShootingStars frame={frame} />
		</svg>
	);
};

// Optional per-script backdrop — the "dam & river" script gets a flowing
// river with a dam silhouette in the gap between the title banner and the
// speech bubbles. Built entirely from animated SVG shapes (no video/gif
// asset) so it renders crisply at any resolution and costs nothing extra to
// loop. Off by default — future scripts with a different metaphor simply
// don't pass riverDam, and nothing here renders.
const RIVER_TOP = 400;
const RIVER_HEIGHT = 160;
const DAM_X = 700;
const DAM_WIDTH = 70;

// A handful of droplets that fall from the dam's spillway on a repeating
// cycle (via frame % cycleLength), each with its own column + timing offset
// so they don't all fall in lockstep.
const SPILLWAY_DROPS = [
	{x: DAM_X + 8, offset: 0, cycle: 42},
	{x: DAM_X + 22, offset: 14, cycle: 38},
	{x: DAM_X + 38, offset: 26, cycle: 45},
	{x: DAM_X + 54, offset: 8, cycle: 40},
	{x: DAM_X + 66, offset: 20, cycle: 36},
];

const RiverDamScene: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
	// Horizontal offset used to scroll the dashed "current" lines rightward —
	// the classic trick for reading as flowing water without any real video.
	const flowOffset = (frame * 2.2) % 64;

	// Gentle vertical bob for the wave crest so the surface feels alive even
	// where the dashed current lines aren't crossing.
	const crestBob = Math.sin((frame / fps) * 1.1) * 4;

	return (
		<svg
			width="100%"
			height="100%"
			style={{position: 'absolute', inset: 0}}
			opacity={0.5}
		>
			<defs>
				<linearGradient id="riverGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#1d5a5e" />
					<stop offset="100%" stopColor="#0f3638" />
				</linearGradient>
			</defs>

			{/* The river band itself, with a soft wavy top edge */}
			<path
				d={`M0,${RIVER_TOP + crestBob}
					C 180,${RIVER_TOP - 14 + crestBob} 360,${RIVER_TOP + 14 + crestBob} 540,${RIVER_TOP + crestBob}
					C 720,${RIVER_TOP - 14 + crestBob} 900,${RIVER_TOP + 14 + crestBob} 1080,${RIVER_TOP + crestBob}
					L 1080,${RIVER_TOP + RIVER_HEIGHT}
					L 0,${RIVER_TOP + RIVER_HEIGHT}
					Z`}
				fill="url(#riverGradient)"
			/>

			{/* Three dashed "current" lines that scroll sideways to read as flow */}
			{[0, 1, 2].map((i) => (
				<line
					key={i}
					x1={-64}
					x2={1144}
					y1={RIVER_TOP + 34 + i * 40}
					y2={RIVER_TOP + 34 + i * 40}
					stroke="#8fd9d6"
					strokeOpacity={0.35}
					strokeWidth={2.5}
					strokeDasharray="22 18"
					strokeDashoffset={-flowOffset - i * 9}
					strokeLinecap="round"
				/>
			))}

			{/* The dam: a simple concrete-block pier spanning the river's height */}
			<rect
				x={DAM_X}
				y={RIVER_TOP - 10}
				width={DAM_WIDTH}
				height={RIVER_HEIGHT + 10}
				fill="#6b6f72"
			/>
			{[0, 1, 2, 3].map((row) => (
				<line
					key={row}
					x1={DAM_X}
					x2={DAM_X + DAM_WIDTH}
					y1={RIVER_TOP - 10 + ((row + 1) * (RIVER_HEIGHT + 10)) / 5}
					y2={RIVER_TOP - 10 + ((row + 1) * (RIVER_HEIGHT + 10)) / 5}
					stroke="#55585b"
					strokeWidth={2}
				/>
			))}
			{/* Spillway notch */}
			<rect
				x={DAM_X + 18}
				y={RIVER_TOP - 10}
				width={16}
				height={18}
				fill="#0f3638"
			/>

			{/* Falling spray below the spillway */}
			{SPILLWAY_DROPS.map((d, i) => {
				const t = ((frame + d.offset) % d.cycle) / d.cycle;
				const y = RIVER_TOP + 8 + t * (RIVER_HEIGHT - 10);
				const dropOpacity = Math.sin(t * Math.PI) * 0.8;
				return (
					<circle
						key={i}
						cx={d.x}
						cy={y}
						r={2.2}
						fill="#cdeeec"
						opacity={dropOpacity}
					/>
				);
			})}
		</svg>
	);
};

const Line: React.FC<{line: DialogueLine; colorA: string; colorB: string}> = ({
	line,
	colorA,
	colorB,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = line;

	const fadeIn = interpolate(frame, [0, 12], [0, 1], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});
	const fadeOut = interpolate(
		frame,
		[durationInFrames - 15, durationInFrames],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
	const opacity = Math.min(fadeIn, fadeOut);

	const rise = interpolate(frame, [0, 12], [14, 0], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});

	const isA = line.speaker === 'A';

	return (
		<>
			{line.audioSrc ? <Audio src={line.audioSrc} /> : null}
			<SpeechBubble
				text={line.text}
				side={isA ? 'left' : 'right'}
				accentColor={isA ? colorA : colorB}
				opacity={opacity}
				rise={rise}
				bottom={BUBBLE_BOTTOM}
			/>
		</>
	);
};

export const DialogueVideo: React.FC<DialogueVideoProps> = ({
	lines,
	colorA,
	colorB,
	seriesTitle,
	riverDam,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	let acc = 0;
	let activeSpeaker: 'A' | 'B' = 'A';
	for (const line of lines) {
		if (frame >= acc && frame < acc + line.durationInFrames) {
			activeSpeaker = line.speaker;
			break;
		}
		acc += line.durationInFrames;
	}

	const bobA = Math.sin(frame / fps / 1.4) * 5;
	const bobB = Math.sin(frame / fps / 1.4 + Math.PI) * 5;

	let cursor = 0;

	return (
		<AbsoluteFill style={{backgroundColor: '#0c0d16'}}>
			{/* Original, royalty-free ambient pad (synthesized, not sampled from
			    anywhere) — loops under the whole video regardless of its length,
			    kept quiet so it never competes with the voice lines. */}
			<Audio src={staticFile('audio/background.mp3')} loop volume={0.35} />
			<StarField />
			{riverDam ? <RiverDamScene frame={frame} fps={fps} /> : null}

			{seriesTitle ? (
				<SeriesTitle title={seriesTitle} colorA={colorA} colorB={colorB} />
			) : null}

			{lines.map((line, i) => {
				const from = cursor;
				cursor += line.durationInFrames;
				return (
					<Sequence
						key={i}
						from={from}
						durationInFrames={line.durationInFrames}
						layout="none"
					>
						<Line line={line} colorA={colorA} colorB={colorB} />
					</Sequence>
				);
			})}

			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: -EDGE_OVERLAP,
					opacity: activeSpeaker === 'A' ? 1 : 0.55,
				}}
			>
				<Character
					color={colorA}
					role="curious"
					bob={bobA}
					width={CHAR_WIDTH}
					height={CHAR_HEIGHT}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					right: -EDGE_OVERLAP,
					opacity: activeSpeaker === 'B' ? 1 : 0.55,
				}}
			>
				<Character
					color={colorB}
					role="wise"
					bob={bobB}
					width={CHAR_WIDTH}
					height={CHAR_HEIGHT}
				/>
			</div>
		</AbsoluteFill>
	);
};
