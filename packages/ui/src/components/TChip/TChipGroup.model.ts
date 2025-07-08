export const ChipGroupAlign = {
	LEFT: 'left',
	CENTER: 'center',
	RIGHT: 'right',
};
export type ChipGroupAlign = (typeof ChipGroupAlign)[keyof typeof ChipGroupAlign];

export const ChipGroupDirection = {
	HORIZONTAL: 'horizontal',
	VERTICAL: 'vertical',
};
export type ChipGroupDirection = (typeof ChipGroupDirection)[keyof typeof ChipGroupDirection];

export const ChipGroupType = {
	STACK: 'stack',
	NORMAL: 'normal',
};
export type ChipGroupType = (typeof ChipGroupType)[keyof typeof ChipGroupType];
