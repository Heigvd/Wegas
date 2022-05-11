import { debounce, DebouncedFunc } from 'lodash-es';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

/**
 * Debounce OnChange function.
 */
export function useDebouncedOnChange<T>(
  value: T,
  onChange: ((value: T) => void) | undefined,
  delay: number = 400,
): { currentValue: T; debouncedOnChange: (value: T) => void; flush: () => void; cancel: () => void } {
  // track all sent values
  const sentRef = useRef<T[]>([]);

  const debouncedRef =
    useRef<DebouncedFunc<(v: T) => void> | undefined>(undefined);

  useEffect(() => {
    // unmount-only effect
    return () =>{
      // make sure to flush any pending value before unmounting the hook
      debouncedRef.current && debouncedRef.current.flush();
    };
  }, []);

  /*
   * currentValue
   */
  // initial value is the given one
  const [currentValue, setCurrentValue] = useState<T>(value);

  // Effect to update current value from callee
  useEffect(() => {
    // Receive new value
    const index = sentRef.current.findIndex(v => v === value);

    if (index >= 0) {
      // looks like received value is one we debounced earlier
      // drop the sent ref and do not update the state
      sentRef.current.splice(index, 1);
    } else {
      // new value seems to come from the great-outside
      // do update the currentValue
      setCurrentValue(value);
    }
  }, [value]);

  // nest given onChange in some ref so there is not need to rebuild a new debounced function each time the callback change
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const internalDebouncedOnChange = useMemo(() => {
    // Rebuild Debounced function
    const ref = debouncedRef.current;
    if (ref != null) {
      // make sure to flush pending value before replacing the debouncedFunction
      // TODO: do not flush but fetch pending value and call new debounced function with this value
      ref.flush();
    }

    // The famous debounced function
    const debouncedFN = debounce((value: T) => {
      // Trigger the change
      onChangeRef.current && onChangeRef.current(value);
      // stack debounced value
      sentRef.current.push(value);
    }, delay);

    debouncedRef.current = debouncedFN;
    return debouncedFN;
  }, [delay]);

  const debounceOnChangeCb = useCallback((value: T) => {
    // maintain currentValue up-to-date ASAP
    setCurrentValue(value);
    // call internal debounedOnChange
    debouncedRef.current && debouncedRef.current(value);
  }, []);

  return {
    currentValue,
    debouncedOnChange: debounceOnChangeCb,
    cancel: internalDebouncedOnChange.cancel,
    flush: internalDebouncedOnChange.flush,
  };
}