
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
// ColorValues.ts
export const ColorValues = {
  purple: "#9049ce",
  blue: "#7bcdff",
  navy: "#2217bc",
  "royal-blue": "#146bee",
  "dark-blue": "#220d5c",
  green: "#4fcf4f",
  lime: "#8aff84",
  yellow: "#ffc94b",
  orange: "#f6883a",
  maroon: "#b04f4f",
  olive: "#b0b04f",
  sand: "#e2d699",
  charcoal: "#333333",
  peach: "#ffb3a7",
  teal: "#4fb0b0",
  "blue-gray": "#4f4fb0",
  "blue-green": "#4fb04f",
  red: "#ff4d5e",
  pink: "#ea7f9a",
  brown: "#4f332d",
  gray: "#b0b0b0",
  black: "#111111",
  white: "#ffffff",
  turquoise: "#63d4c7",
  cyan: "#baf0ff",
  indigo: "#571ab4",
  violet: "#dfbaff",
  magenta: "#e524b5",
  rose: "#ff7dff",
  coral: "#ff7d7d",
  gold: "#ffd700",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
} as const;

export type BaseColorValue = keyof typeof ColorValues;

// Auto-generate uppercase keys (BLUE, NAVY, etc.)
export const ColorValue = Object.fromEntries(
  Object.entries(ColorValues).map(([key, value]) => [key.toUpperCase().replace(/-/g, "_"), value])
) as {
  readonly [K in Uppercase<BaseColorValue> as ReplaceHyphens<K>]: string;
};

// Helper type: replace "-" with "_"
type ReplaceHyphens<S extends string> = S extends `${infer A}-${infer B}`
  ? `${ReplaceHyphens<A>}_${ReplaceHyphens<B>}`
  : S;
