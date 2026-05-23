import { useEffect, useState } from 'react';

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue === null ? initialValue : JSON.parse(storedValue);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail in private modes. The app still works in memory.
    }
  }, [key, value]);

  return [value, setValue];
}
