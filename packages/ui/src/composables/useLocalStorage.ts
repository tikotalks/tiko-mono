import { ref, watch } from 'vue'

/**
 * Reactive localStorage wrapper
 * @param key - The localStorage key
 * @param defaultValue - Default value if nothing is stored
 * @returns Reactive value that syncs with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
) {
  // Get initial value from localStorage
  const storedValue = localStorage.getItem(key)
  let initialValue: T
  
  if (storedValue !== null) {
    try {
      const parsed = JSON.parse(storedValue)
      // Handle double-encoded strings by checking if parsed result is a string that looks like JSON
      if (typeof parsed === 'string' && typeof defaultValue === 'string') {
        // If it starts and ends with quotes, it's double-encoded
        if (parsed.startsWith('"') && parsed.endsWith('"')) {
          initialValue = parsed.slice(1, -1) as T
        } else {
          initialValue = parsed as T
        }
      } else {
        initialValue = parsed
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage value for key "${key}":`, error)
      initialValue = defaultValue
    }
  } else {
    initialValue = defaultValue
  }

  // Create reactive ref
  const data = ref<T>(initialValue)

  // Watch for changes and update localStorage
  watch(data, (newValue) => {
    if (newValue === null || newValue === undefined) {
      localStorage.removeItem(key)
    } else {
      // For strings, check if we're about to double-encode
      if (typeof newValue === 'string') {
        // Clean the value first - remove quotes if they exist
        const cleanValue = newValue.startsWith('"') && newValue.endsWith('"') 
          ? newValue.slice(1, -1) 
          : newValue
        localStorage.setItem(key, JSON.stringify(cleanValue))
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    }
  }, { deep: true })

  // Setter function
  const setData = (value: T) => {
    data.value = value
  }

  return [data, setData] as const
}

/**
 * Simple localStorage wrapper without reactivity
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue
      
      const parsed = JSON.parse(item)
      // Handle double-encoded strings
      if (typeof parsed === 'string' && typeof defaultValue === 'string') {
        if (parsed.startsWith('"') && parsed.endsWith('"')) {
          return parsed.slice(1, -1) as T
        }
      }
      return parsed
    } catch {
      return defaultValue
    }
  },

  set<T>(key: string, value: T): void {
    try {
      // For strings, clean them first to prevent double-encoding
      if (typeof value === 'string') {
        const cleanValue = value.startsWith('"') && value.endsWith('"') 
          ? value.slice(1, -1) 
          : value
        localStorage.setItem(key, JSON.stringify(cleanValue))
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
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