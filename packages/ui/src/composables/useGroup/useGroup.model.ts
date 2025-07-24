// Direction

export const GroupDirection = {
	ROW: 'row',
	COLUMN: 'column',
};

export type GroupDirectionType = (typeof GroupDirection)[keyof typeof GroupDirection];
export interface ResponsiveDirection {
	mobile: GroupDirectionType;
	tablet?: GroupDirectionType;
	desktop: GroupDirectionType;
}

// Align

export const GroupAlign = {
	START: 'start',
	CENTER: 'center',
	END: 'end',
};
export type GroupAlignType = (typeof GroupAlign)[keyof typeof GroupAlign];
export interface ResponsiveAlign {
	mobile: GroupAlignType;
	tablet?: GroupAlignType;
	desktop: GroupAlignType;
}

// Wrap

export const GroupWrap = {
	WRAP: 'wrap',
	NOWRAP: 'nowrap',
	AUTO: 'auto',
};
export type GroupWrapType = (typeof GroupWrap)[keyof typeof GroupWrap];
export interface ResponsiveWrap {
	mobile: GroupWrapType;
	tablet?: GroupWrapType;
	desktop: GroupWrapType;
}

type Breakpoints<T> = T | { mobile: T; tablet?: T; desktop: T };

export const groupProps = {
	direction: {
		type: [String, Object] as PropType<Breakpoints<'row' | 'column'>>,
		default: 'row',
	},
	align: {
		type: [String, Object] as PropType<Breakpoints<'start' | 'center' | 'end'>>,
		default: 'start',
	},
	wrap: {
		type: [String, Object] as PropType<Breakpoints<'wrap' | 'nowrap' | 'auto'>>,
		default: 'auto',
	},
};
