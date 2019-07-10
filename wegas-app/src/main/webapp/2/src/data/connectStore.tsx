import * as React from 'react';
import { Store } from 'redux';
import { shallowIs } from '../Helper/shallowIs';

function id<T>(x: T) {
  return x;
}
function refDifferent(a: unknown, b: unknown) {
  return a !== b;
}
function shallowDifferent(a: unknown, b: unknown) {
  return !shallowIs(a, b);
}
export function createStoreConnector<S extends Store>(store: S) {
  type State = ReturnType<S['getState']>;
  type Dispatch = S['dispatch'];

  /**
   * Hook, connect to store. Update if the selectors returns something different, as defined by shouldUpdate.
   * @param selector Select a specific part of the store
   * @param shouldUpdate Will update the component if this function returns true.
   * Default to ref comparing values returned from selector
   */
  function useStore<R>(
    selector: (state: State) => R,
    shouldUpdate: (oldValue: R, newValue: R) => boolean = refDifferent,
  ) {
    const [selected, setSelected] = React.useState(() =>
      selector(store.getState()),
    );
    React.useEffect(() => {
      const stateUpdater = () => {
        const value = selector(store.getState());
        setSelected(v => {
          if (shouldUpdate(v, value)) {
            return value;
          }
          return v;
        });
      };
      const sub = store.subscribe(stateUpdater);
      stateUpdater();
      return sub;
    }, [selector, shouldUpdate]);
    return selected;
  }

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
      selector = id as (s: State) => State,
      children,
      shouldUpdate = shallowDifferent,
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
