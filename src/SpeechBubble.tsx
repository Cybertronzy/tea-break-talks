import React from 'react';

export const SpeechBubble: React.FC<{
	text: string;
	side: 'left' | 'right';
	accentColor: string;
	opacity: number;
	rise: number;
	bottom: number;
}> = ({text, side, accentColor, opacity, rise, bottom}) => {
	const bubbleStyle: React.CSSProperties = {
		position: 'absolute',
		bottom,
		width: 620,
		...(side === 'left' ? {left: 24} : {right: 24}),
		opacity,
		transform: `translateY(${rise}px)`,
	};

	return (
		<div style={bubbleStyle}>
			<div
				style={{
					background: '#171826',
					border: `4px solid ${accentColor}`,
					borderRadius: 36,
					padding: '38px 44px',
					fontFamily: 'Georgia, "Iowan Old Style", serif',
					fontSize: 46,
					lineHeight: 1.3,
					color: '#f3efe6',
					textAlign: side === 'left' ? 'left' : 'right',
					boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
				}}
			>
				{text}
			</div>
			{/* tail pointing down toward the speaking character */}
			<div
				style={{
					position: 'absolute',
					bottom: -17,
					...(side === 'left' ? {left: 80} : {right: 80}),
					width: 34,
					height: 34,
					background: '#171826',
					borderRight: side === 'left' ? `4px solid ${accentColor}` : 'none',
					borderBottom: `4px solid ${accentColor}`,
					borderLeft: side === 'right' ? `4px solid ${accentColor}` : 'none',
					transform: 'rotate(45deg)',
				}}
			/>
		</div>
	);
};
