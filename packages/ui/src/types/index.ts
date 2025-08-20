export * from "./color";

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
