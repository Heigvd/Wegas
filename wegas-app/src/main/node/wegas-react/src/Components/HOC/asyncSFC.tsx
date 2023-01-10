import * as React from 'react';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { useAsync } from '../Hooks/useAsync';

function Loading() {
  return <FontAwesome icon="cog" /*size="5x"*/ spin />;
}

function ErrorDisplay(err: unknown) {
  if(err instanceof Error){
    return <div>Error : {err.message}</div>;
  }else{
    const s = String(err);
    return <div>Error : unknown error : {s}</div>;
  }
}

/**
 * async SFC
 * @param PComp
 * @param Loader
 * @param Err
 */
export function asyncSFC<T>(
  PComp: (props: T) => Promise<React.ReactElement | null>,
  Loader: React.FunctionComponent<UnknownValuesObject> = Loading,
  Err: React.FunctionComponent<{ err: unknown }> = ErrorDisplay,
) {
  function AsyncDeps(props: T): React.ReactElement {
    const { status, data, error } = useAsync(
      React.useMemo(() => PComp(props), [props]),
    );
    switch (status) {
      case 'pending':
        return <Loader />;
      case 'rejected':
        return <Err err={error} />;
      case 'resolved':
        return data!;
    }
  }
  return AsyncDeps;
}
