import * as React from 'react';
import { isEqual } from 'lodash-es';

export function useDeepChanges<T>(props: T, dispatch: (props: T) => void) {
  const lastProps = React.useRef<T>();
  React.useEffect(() => {
    if (!isEqual(lastProps.current, props)) {
      lastProps.current = props;
      dispatch(props);
    }
  }, [dispatch, props]);
}
