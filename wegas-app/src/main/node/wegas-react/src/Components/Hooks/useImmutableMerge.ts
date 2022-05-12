import * as React from 'react';
import immutableMerge from '../../Helper/immutableMerge';

export function useImmutableMerge<T>(value: T): T {
  const oldValue = React.useRef<T>(value);
  const newValue = immutableMerge(oldValue.current, value);
  oldValue.current = newValue;
  return newValue;
}
