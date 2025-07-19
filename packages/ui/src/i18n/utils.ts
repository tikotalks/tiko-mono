import type { TranslationSchema } from './types'

// Deep partial type helper
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Deep merge two objects, with the second object overriding the first
 */
function deepMerge<T extends object>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base } as T

  for (const key in overrides) {
    if (key in result) {
      const baseValue = result[key]
      const overrideValue = overrides[key]
      
      if (
        typeof baseValue === 'object' &&
        typeof overrideValue === 'object' &&
        baseValue !== null &&
        overrideValue !== null &&
        !Array.isArray(baseValue) &&
        !Array.isArray(overrideValue)
      ) {
        // Deep merge objects
        result[key] = deepMerge(baseValue, overrideValue as DeepPartial<typeof baseValue>)
      } else if (overrideValue !== undefined) {
        // Override primitive values
        result[key] = overrideValue as T[typeof key]
      }
    }
  }

  return result
}

/**
 * Create a locale that extends from a base locale with type-safe partial overrides
 */
export function extendLocale(
  base: TranslationSchema,
  overrides: DeepPartial<TranslationSchema> = {}
): TranslationSchema {
  return deepMerge(base, overrides)
}