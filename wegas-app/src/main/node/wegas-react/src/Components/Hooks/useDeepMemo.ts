import * as React from 'react';
import { deepDifferent } from './storeHookFactory';

export function useDeepMemo<T>(value: T): T {
  const oldValue = React.useRef<T>(value);
  return React.useMemo(() => {
    if (deepDifferent(oldValue.current, value)) {
      oldValue.current = value;
      return value;
    } else {
      return oldValue.current;
    }
  }, [value]);
}
