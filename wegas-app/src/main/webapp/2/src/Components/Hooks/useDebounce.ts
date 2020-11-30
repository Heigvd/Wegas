import { useState, useEffect, useRef } from 'react';

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

export function useTimeout(action: () => void, delay: number = 100) {
  const timer = useRef<NodeJS.Timeout>();

  const delayedAction = () => {
    if (timer.current != null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      action();
    }, delay);
  };
  return delayedAction;
}
