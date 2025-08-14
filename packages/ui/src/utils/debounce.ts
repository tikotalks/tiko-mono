/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * Creates a debounced function that returns a promise
 * 
 * @param func The async function to debounce
 * @param wait The number of milliseconds to delay
 * @returns The debounced function that returns a promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let resolveRef: ((value: ReturnType<T>) => void) | undefined
  let rejectRef: ((reason?: any) => void) | undefined

  return function debounced(...args: Parameters<T>): Promise<ReturnType<T>> {
    clearTimeout(timeoutId)

    return new Promise((resolve, reject) => {
      resolveRef = resolve
      rejectRef = reject

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args)
          resolveRef?.(result)
        } catch (error) {
          rejectRef?.(error)
        }
      }, wait)
    })
  }
}