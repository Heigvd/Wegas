import { isEqual } from 'lodash-es';
import * as React from 'react';
import { AnyAction, Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { shallowIs } from '../../Helper/shallowIs';

export function refDifferent(a: any, b: any) {
  return a !== b;
}
export function shallowDifferent<T>(a: T, b: T) {
  return !shallowIs(a, b);
}
export function deepDifferent<T>(a: T, b: T) {
  // if (a === undefined && b === undefined) {
  //   return false;
  // } else if (a === null && b === null) {
  //   return false;
  // } else if (a == null || b == null) {
  //   return true;
  // }
  // return JSON.stringify(a) !== JSON.stringify(b);
  return !isEqual(a, b);
}

export type StoreType<S, A extends AnyAction> = Store<
  Readonly<S>,
  AnyAction
> & {
  dispatch: ThunkDispatch<S, undefined, A>;
};
/**
 * Hook, connect to store. Update if the selectors returns something different, as defined by shouldUpdate.
 * @param selector Select a specific part of the store. Warning, this must be a static function!
 * @param shouldUpdate Will update the component if this function returns true.
 * Default to ref comparing values returned from selector
 */
export function useAnyStore<R, S, A extends AnyAction>(
  selector: (state: S) => R,
  shouldUpdate: (oldValue: R, newValue: R) => boolean = shallowDifferent,
  store: StoreType<S, A>,
) {
  const [selected, setSelected] = React.useState(() =>
    selector(store.getState()),
  );
  const isFirstRun = React.useRef(true);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const stateUpdater = React.useCallback(() => {
    const value = selector(store.getState());
    if (mounted.current === true) {
      setSelected(v => {
        if (shouldUpdate(v, value)) {
          return value;
        }
        return v;
      });
    }
  }, [selector, shouldUpdate, store]);
  React.useEffect(() => {
    // if the stateUpdater changed, run it.
    if (isFirstRun.current) {
      // Not first time since it runs in store initializer
      isFirstRun.current = false;
      return;
    }
    stateUpdater();
  }, [stateUpdater]);
  React.useEffect(() => store.subscribe(stateUpdater), [stateUpdater, store]);
  return selected;
}
