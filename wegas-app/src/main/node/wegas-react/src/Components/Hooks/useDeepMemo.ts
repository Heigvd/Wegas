import { isEqual } from 'lodash-es';
import * as React from 'react';

export function useDeepMemo<T>(value: T): T {
  const oldValue = React.useRef<T>(value);
  // if new value is deep different from previous one
  // update the ref
  if (!isEqual(oldValue.current, value)) {
    oldValue.current = value;
  }

  // always return the ref
  return oldValue.current;
}
