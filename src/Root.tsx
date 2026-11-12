import React from 'react';
import {Composition} from 'remotion';
import {DialogueVideo} from './DialogueVideo';
import {damLines, damColors} from './scripts/dam';

const FPS = 30;
const totalFrames = damLines.reduce((sum, l) => sum + l.durationInFrames, 0);

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="DamDialogue"
				component={DialogueVideo}
				durationInFrames={totalFrames}
				fps={FPS}
				width={1080}
				height={1920}
				defaultProps={{
					lines: damLines,
					colorA: damColors.colorA,
					colorB: damColors.colorB,
					seriesTitle: 'TEA BREAK TALKS',
				}}
			/>
		</>
	);
};
