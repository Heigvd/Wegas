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
    const isFirstRun = React.useRef(true);
    const stateUpdater = React.useCallback(() => {
      const value = selector(store.getState());
      setSelected(v => {
        if (shouldUpdate(v, value)) {
          return value;
        }
        return v;
      });
    }, [selector, shouldUpdate]);
    React.useEffect(() => {
      // if the stateUpdater changed, run it.
      if (isFirstRun.current) {
        // Not first time since it runs in store initializer
        isFirstRun.current = false;
        return;
      }
      stateUpdater();
    }, [stateUpdater]);
    React.useEffect(() => store.subscribe(stateUpdater), [stateUpdater]);
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
