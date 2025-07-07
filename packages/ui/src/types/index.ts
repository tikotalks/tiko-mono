export const Size = {
    SMALL: 'small',
    DEFAULT: 'default',
    MEDIUM: 'medium',
    LARGE: 'large',
} as const;

export type Size = (typeof Size)[keyof typeof Size];