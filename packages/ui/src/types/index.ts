export const ColorMode = {
	LIGHT: 'light',
	DARK: 'dark',
};
export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

export const FontSize = {
	SMALL: 'small',
	MEDIUM: 'medium',
	LARGE: 'large',
	XLARGE: 'xlarge',
};
export type FontSize = (typeof FontSize)[keyof typeof FontSize];

export const BaseColors = {
	PURPLE: 'purple',
	BLUE: 'blue',
	NAVY: 'navy',
	ROYAL_BLUE: 'royal-blue',
	DARK_BLUE: 'dark-blue',
	GREEN: 'green',
	LIME: 'lime',
	YELLOW: 'yellow',
	ORANGE: 'orange',
	PINK: 'pink',
	MAROON: 'maroon',
	RED: 'red',
	BROWN: 'brown',
	TEAL: 'teal',
	OLIVE: 'olive',
	BLACK: 'black',
	GRAY: 'gray',
	WHITE: 'white',
	TURQUOISE: 'turquoise',
	CYAN: 'cyan',
	INDIGO: 'indigo',
	VIOLET: 'violet',
	MAGENTA: 'magenta',
	ROSE: 'rose',
	CORAL: 'coral',
	GOLD: 'gold',
	SILVER: 'silver',
	BRONZE: 'bronze',
	SAND: 'sand',
	BLUE_GRAY: 'blue-gray',
	BLUE_GREEN: 'blue-green',
	CHARCOAL: 'charcoal',
};

export type BaseColors = (typeof BaseColors)[keyof typeof BaseColors];

export const Colors = {
	PRIMARY: 'primary',
	SECONDARY: 'secondary',
	TERTIARY: 'tertiary',
	QUATERNARY: 'quaternary',
	QUINARY: 'quinary',
	ACCENT: 'accent',
	BACKGROUND: 'background',
	FOREGROUND: 'foreground',
	DARK: 'dark',
	LIGHT: 'light',
	SUCCESS: 'success',
	WARNING: 'warning',
	ERROR: 'error',
	INFO: 'info',
};

export type Colors = (typeof Colors)[keyof typeof Colors];

export const AllColors = { ...BaseColors, ...Colors };
export type AllColors = BaseColors & Colors;

export const Screen = {
	DESKTOP: 'desktop',
	TABLET: 'tablet',
	MOBILE: 'mobile',
};

export type Screen = (typeof Screen)[keyof typeof Screen];

export const Status = {
	IDLE: 'idle',
	LOADING: 'loading',
	ERROR: 'error',
	SUCCESS: 'success',
};
export type Status = (typeof Status)[keyof typeof Status];

export const Size = {
	DEFAULT: 'default',
	X_SMALL: 'x-small',
	SMALL: 'small',
	MEDIUM: 'medium',
	LARGE: 'large',
	X_LARGE: 'x-large',
};
export type Size = (typeof Size)[keyof typeof Size];

export const NotificationType = {
	ERROR: 'error',
	INFO: 'info',
	DEFAULT: 'default',
	WARNING: 'warning',
	SUCCESS: 'success',
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export type { TikoConfig, TikoThemeColors } from './tiko-config';
export { defineConfig } from './tiko-config';
