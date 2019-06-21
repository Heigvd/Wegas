import * as React from 'react';
import { useAsync } from '../Hooks/useAsync';

/**
 * async SFC
 * @param PComp
 * @param Loader
 * @param Err
 */
export function asyncSFC<T>(
  PComp: (props: T) => Promise<React.ReactElement | null>,
  Loader: React.FunctionComponent<{}> = () => null,
  Err: React.FunctionComponent<{ err: unknown }> = () => null,
) {
  function AsyncDeps(props: T): React.ReactElement {
    const { status, data } = useAsync(
      React.useMemo(() => PComp(props), [props]),
    );
    switch (status) {
      case 'pending':
        return <Loader />;
      case 'rejected':
        return <Err err={data} />;
      case 'resolved':
        return data!;
    }
  }
  return AsyncDeps;
}
