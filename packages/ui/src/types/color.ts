import { lighten, darken } from "@sil/color";


// colors.ts
// --- Base (maintain only these 19) ---
const BaseColorValues = {
  red: "#f40935",
  pink: "#e23ea9",
  purple: "#b214c0",
  violet: "#7f23d3",
  blue: "#2923d3",
  cobalt: "#2376d3",
  skyblue: "#3bb6f1",
  cyan: "#2dcfdc",
  teal: "#49dba3",
  green: "#55c267",
  lime: "#a9e14b",
  apple: "#e7ed3f",
  yellow: "#fde824",
  gold: "#ffb647",
  orange: "#ff8d22",
  brown: "#806755",
  coral: "#f96459",
  beige: "#dabd9f",
  lavender: "#bface1",
  gray: "#989499",
} as const;

// --- Use your manipulation lib ---

type ColorHex = `#${string}`;

// compute light/dark with sensible defaults
const LIGHTEN_PCT = 18;
const DARKEN_PCT = 16;

function extendColorValues<T extends Record<string, ColorHex>>(
  colors: T,
  lightenPct = LIGHTEN_PCT,
  darkenPct = DARKEN_PCT
) {
  const out: Record<string, ColorHex> = { ...colors };
  for (const [name, hex] of Object.entries(colors)) {
    out[`${name}-light`] = lighten(hex as ColorHex, lightenPct) as ColorHex;
    out[`${name}-dark`]  = darken(hex as ColorHex, darkenPct) as ColorHex;
  }
  return out as T &
    Record<`${keyof T & string}-light`, ColorHex> &
    Record<`${keyof T & string}-dark`, ColorHex>;
}

// --- All color values (base + computed variants) ---
export const ColorValues = extendColorValues(BaseColorValues);

// --- Uppercase accessors to HEX (RED, RED_LIGHT, ...) ---
type ReplaceHyphens<S extends string> = S extends `${infer A}-${infer B}`
  ? `${ReplaceHyphens<A>}_${ReplaceHyphens<B>}`
  : S;

export const ColorValue = Object.fromEntries(
  Object.entries(ColorValues).map(([k, v]) => [k.toUpperCase().replace(/-/g, "_"), v])
) as { readonly [K in Uppercase<keyof typeof ColorValues> as ReplaceHyphens<K>]: ColorHex };

// --- BaseColors tokens (include light/dark automatically) ---
export const BaseColors = Object.fromEntries(
  Object.keys(ColorValues).map((k) => [k.toUpperCase().replace(/-/g, "_"), k])
) as {
  readonly [K in Uppercase<keyof typeof ColorValues> as ReplaceHyphens<K>]: keyof typeof ColorValues;
};
export type BaseColors = (typeof BaseColors)[keyof typeof BaseColors];

// --- Semantic colors (unchanged) ---
export const Colors = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  QUATERNARY: "quaternary",
  QUINARY: "quinary",
  ACCENT: "accent",
  BACKGROUND: "background",
  FOREGROUND: "foreground",
  DARK: "dark",
  LIGHT: "light",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
} as const;

export type Colors = (typeof Colors)[keyof typeof Colors];

// --- AllColors (union of tokens + semantic) ---
export const AllColors = { ...BaseColors, ...Colors } as const;
export type AllColors = (typeof AllColors)[keyof typeof AllColors];
