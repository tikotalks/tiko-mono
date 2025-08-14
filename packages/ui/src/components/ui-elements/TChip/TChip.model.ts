import type { Icons } from 'open-icon';

export const ChipType = {
	DEFAULT: 'default',
};

export type ChipType = (typeof ChipType)[keyof typeof ChipType];

export const ChipColor = {
	PRIMARY: 'primary',
	SECONDARY: 'secondary',
	TERTIARY: 'tertiary',
	ACCENT: 'accent',
};
export type ChipColor = (typeof ChipColor)[keyof typeof ChipColor];

export type ChipIcon = Icons;
