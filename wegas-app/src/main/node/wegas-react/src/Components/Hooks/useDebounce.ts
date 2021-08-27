import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook, debounce a value
 * @param value value to debounce
 * @param delay ms delay
 */
export function useDebounce<T>(value: T, delay: number = 100) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(() => value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Hook, debounce a function
 * @param fn function to debounce
 * @param delay ms delay
 */
export function useDebounceFn(fn: (args: any) => any, delay: number = 100) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const debouncedFN = useCallback(
    (args: any) => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(() => {
        fn(args);
      }, delay);
    },
    [delay, fn],
  );

  return debouncedFN;
}
