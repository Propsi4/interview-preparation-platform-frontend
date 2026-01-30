import { useEffect, useState } from 'react'

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    const item = window.localStorage.getItem(key)
    if (item) {
      try {
        return JSON.parse(item) as T
      } catch {
        return initialValue
      }
    }
    return initialValue
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue))
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
