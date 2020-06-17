import * as React from 'react';
import { deepDifferent } from './storeHookFactory';

export function useDeepChanges<T>(props: T, dispatch: (props: T) => void) {
  const lastProps = React.useRef<T>();
  React.useEffect(() => {
    if (deepDifferent(lastProps.current, props)) {
      lastProps.current = props;
      dispatch(props);
    }
  }, [dispatch, props]);
}
