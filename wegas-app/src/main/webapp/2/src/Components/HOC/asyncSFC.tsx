import * as React from 'react';
import { useAsync } from '../Hooks/useAsync';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';

function Loading() {
  return <FontAwesome icon="cog" size="5x" spin />;
}

function Error(err: unknown) {
  return <div>Error : {err}</div>;
}

/**
 * async SFC
 * @param PComp
 * @param Loader
 * @param Err
 */
export function asyncSFC<T>(
  PComp: (props: T) => Promise<React.ReactElement | null>,
  Loader: React.FunctionComponent<{}> = Loading,
  Err: React.FunctionComponent<{ err: unknown }> = Error,
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
