import React from 'react';

export type CharacterRole = 'curious' | 'wise';

export const Character: React.FC<{
	color: string;
	role: CharacterRole;
	bob: number; // vertical offset in px, for a gentle idle sway
	width?: number;
	height?: number;
}> = ({color, role, bob, width = 160, height = 270}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 160 270"
			style={{transform: `translateY(${bob}px)`, display: 'block'}}
		>
			{/* legs */}
			<rect x="58" y="188" width="16" height="55" rx="8" fill={color} />
			<rect x="86" y="188" width="16" height="55" rx="8" fill={color} />
			<ellipse cx="66" cy="246" rx="14" ry="7" fill={color} />
			<ellipse cx="94" cy="246" rx="14" ry="7" fill={color} />

			{/* arms: curious = raised shrug, wise = resting at sides */}
			{role === 'curious' ? (
				<>
					<line
						x1="52"
						y1="135"
						x2="18"
						y2="100"
						stroke={color}
						strokeWidth={18}
						strokeLinecap="round"
					/>
					<line
						x1="108"
						y1="135"
						x2="142"
						y2="100"
						stroke={color}
						strokeWidth={18}
						strokeLinecap="round"
					/>
					<circle cx="18" cy="100" r="10" fill={color} />
					<circle cx="142" cy="100" r="10" fill={color} />
				</>
			) : (
				<>
					<line
						x1="50"
						y1="132"
						x2="45"
						y2="186"
						stroke={color}
						strokeWidth={16}
						strokeLinecap="round"
					/>
					<line
						x1="110"
						y1="132"
						x2="115"
						y2="186"
						stroke={color}
						strokeWidth={16}
						strokeLinecap="round"
					/>
					<circle cx="45" cy="186" r="9" fill={color} />
					<circle cx="115" cy="186" r="9" fill={color} />
				</>
			)}

			{/* torso + head */}
			<ellipse cx="80" cy="155" rx="34" ry="46" fill={color} />
			<ellipse cx="80" cy="62" rx="46" ry="50" fill={color} />

			{/* eyes: curious = round dots, wise = half-lidded lines */}
			{role === 'curious' ? (
				<>
					<circle cx="62" cy="58" r="7" fill="#17161a" />
					<circle cx="98" cy="58" r="7" fill="#17161a" />
				</>
			) : (
				<>
					<rect x="52" y="55" width="20" height="6" rx="3" fill="#17161a" />
					<rect x="88" y="55" width="20" height="6" rx="3" fill="#17161a" />
				</>
			)}
		</svg>
	);
};
