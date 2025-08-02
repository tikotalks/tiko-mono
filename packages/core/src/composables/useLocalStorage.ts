import { ref, watch, type Ref, type UnwrapRef } from 'vue'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: {
    serializer?: {
      read: (value: string) => T
      write: (value: T) => string
    }
  }
): Ref<T> {
  const serializer = options?.serializer || {
    read: (v: string) => {
      try {
        return JSON.parse(v)
      } catch {
        return v as unknown as T
      }
    },
    write: (v: T) => JSON.stringify(v)
  }

  const storedValue = localStorage.getItem(key)
  const initialValue = storedValue !== null 
    ? serializer.read(storedValue)
    : defaultValue

  const data = ref<T>(initialValue)

  watch(data, (newValue) => {
    if (newValue === null || newValue === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, serializer.write(newValue))
    }
  }, { deep: true })

  return data
}