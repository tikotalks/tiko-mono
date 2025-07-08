export const ToolTipPosition = {
	TOP: 'top',
	RIGHT: 'right',
	BOTTOM: 'bottom',
	LEFT: 'left',
};

export type ToolTipPosition = (typeof ToolTipPosition)[keyof typeof ToolTipPosition];
