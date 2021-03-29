import { useState, useEffect } from 'react';

/**
 * Hook, debounce a value
 * @param value value to debounce
 * @param delay ms delay
 */
export function useDebounce<T>(value: T, delay: number = 100) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
