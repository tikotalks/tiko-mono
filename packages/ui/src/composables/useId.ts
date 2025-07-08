/**
 * Composable for generating unique IDs
 * Provides a simple way to generate unique identifiers for form elements and components
 */

let idCounter = 0

/**
 * Generate a unique ID string
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 * 
 * @example
 * const id = useId() // Returns "tiko-1"
 * const customId = useId('input') // Returns "input-2"
 */
export function useId(prefix = 'tiko'): string {
  idCounter++
  return `${prefix}-${idCounter}`
}

/**
 * Generate multiple unique IDs with a common prefix
 * 
 * @param prefix - Prefix for all IDs
 * @param count - Number of IDs to generate
 * @returns Array of unique ID strings
 * 
 * @example
 * const [inputId, labelId, errorId] = useIds('form', 3)
 * // Returns ["form-1", "form-2", "form-3"]
 */
export function useIds(prefix = 'tiko', count = 1): string[] {
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    ids.push(useId(prefix))
  }
  return ids
}

/**
 * Generate IDs for form field components
 * Provides common IDs needed for form accessibility
 * 
 * @param base - Base name for the form field
 * @returns Object with input, label, error, and description IDs
 * 
 * @example
 * const { inputId, labelId, errorId, descriptionId } = useFormIds('email')
 * // Returns {
 * //   inputId: "email-input-1",
 * //   labelId: "email-label-2", 
 * //   errorId: "email-error-3",
 * //   descriptionId: "email-description-4"
 * // }
 */
export function useFormIds(base: string) {
  return {
    inputId: useId(`${base}-input`),
    labelId: useId(`${base}-label`),
    errorId: useId(`${base}-error`),
    descriptionId: useId(`${base}-description`)
  }
}