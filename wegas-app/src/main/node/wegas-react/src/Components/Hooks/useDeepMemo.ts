import { isEqual } from 'lodash-es';
import * as React from 'react';

export function useDeepMemo<T>(value: T): T {
  const oldValue = React.useRef<T>(value);
  return React.useMemo(() => {
    if (!isEqual(oldValue.current, value)) {
      oldValue.current = value;
      return value;
    } else {
      return oldValue.current;
    }
  }, [value]);
}
