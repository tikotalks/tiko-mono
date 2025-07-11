import { ref, watch, Ref } from 'vue'

/**
 * Reactive localStorage wrapper
 * @param key - The localStorage key
 * @param defaultValue - Default value if nothing is stored
 * @returns Reactive value that syncs with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [Ref<T>, (value: T) => void] {
  // Get initial value from localStorage
  const storedValue = localStorage.getItem(key)
  const initialValue = storedValue !== null 
    ? JSON.parse(storedValue) 
    : defaultValue

  // Create reactive ref
  const data = ref<T>(initialValue)

  // Watch for changes and update localStorage
  watch(data, (newValue) => {
    if (newValue === null || newValue === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }, { deep: true })

  // Setter function
  const setData = (value: T) => {
    data.value = value
  }

  return [data, setData]
}

/**
 * Simple localStorage wrapper without reactivity
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },

  clear(): void {
    localStorage.clear()
  }
}