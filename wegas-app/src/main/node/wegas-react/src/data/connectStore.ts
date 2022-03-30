import * as React from 'react';
import { AnyAction } from 'redux';
import {
  refDifferent,
  StoreType,
  useAnyStore,
} from '../Components/Hooks/storeHookFactory';

function id<T>(x: T) {
  return x;
}

export function createStoreConnector<
  SS,
  SA extends AnyAction,
  // S extends Store<SS, SA>
>(store: StoreType<SS, SA>) {
  type S = StoreType<SS, SA>;
  type State = ReturnType<S['getState']>;
  type Dispatch = S['dispatch'];

  /**
   * Hook, connect to store. Update if the selectors returns something different, as defined by shouldUpdate.
   * @param selector Select a specific part of the store. Warning this must be a static function!
   * @param shouldUpdate Will update the component if this function returns true.
   * Default to ref comparing values returned from selector
   */

  const useStore = <R>(
    selector: (state: State) => R,
    shouldUpdate?: (oldValue: R, newValue: R) => boolean,
  ) => useAnyStore(selector, shouldUpdate, store);

  function getDispatch() {
    return store.dispatch;
  }

  function ReduxConsumer<R = State>(props: {
    selector?: (state: State) => R;
    /**
     * defaults to shallow comparing selector's return value
     */
    shouldUpdate?: (oldValue: R, newValue: R) => boolean;
    children: (store: {
      state: R;
      dispatch: Dispatch;
    }) => React.ReactElement | null;
  }) {
    const {
      selector = id as (s: State) => R,
      children,
      shouldUpdate = refDifferent,
    } = props;
    const state = useStore(selector, shouldUpdate);
    return children({ dispatch: getDispatch(), state });
  }
  return {
    StoreConsumer: ReduxConsumer,
    useStore,
    getDispatch: getDispatch,
  };
}
