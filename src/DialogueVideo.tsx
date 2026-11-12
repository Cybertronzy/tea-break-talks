import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Sequence,
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
			<StarField />

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
