import * as React from 'react';
/**
 * Hook to resolve a promise or a promise constructor
 *
 * @param promise Promise to resolve or promise constructor to call.
 * Should pass a memoized value if necessary
 */
export function useAsync<O>(promise: Promise<O> | (() => Promise<O>)) {
  const [state, setState] = React.useState<{
    error?: unknown;
    data?: O;
    status: 'pending' | 'resolved' | 'rejected';
  }>({ status: 'pending' });
  React.useEffect(() => {
    let alive = true;
    let p: Promise<O>;
    if (typeof promise === 'function') {
      p = promise();
    } else {
      p = promise;
    }
    p.then(
      result => alive && setState({ status: 'resolved', data: result }),
      error => alive && setState({ status: 'rejected', error: error }),
    );
    return () => {
      alive = false;
    };
  }, [promise]);
  return state;
}
