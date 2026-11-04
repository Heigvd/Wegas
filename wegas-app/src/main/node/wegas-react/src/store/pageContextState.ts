/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { registerEffect } from '../Helper/pageEffectsManager';
import { useAppSelector } from './hooks';
import {
  PageContextValues,
  selectIsReloading,
  selectLivePageContext,
  selectPublishedPageContext,
  setStateValue,
} from './slices/pageContext';
import { dispatch, store } from './store';

/**
 * Everything about the page context that needs the store *instance* rather than
 * just its reducer. It cannot live in `slices/pageContext.ts`: that would import
 * `./hooks` / `./store`, which import the slice back.
 */

/* ------------------------------------------------------------------ *
 * React access
 * ------------------------------------------------------------------ */

/**
 * The page context as client scripts should see it.
 *
 * While client scripts are being re-evaluated this keeps returning the snapshot
 * taken before the reload started -- same object reference throughout, so
 * consumers neither re-render nor re-evaluate their scripts against a
 * half-rebuilt context.
 */
export function usePageContext(): PageContextValues {
  return useAppSelector(selectPublishedPageContext);
}

/**
 * The live page context, for the imperative script-evaluation paths that have no
 * component to read it from. Deliberately *not* the published view: client
 * library evaluation runs inside the reload window and has to see the values it
 * is itself producing.
 */
export function getLivePageContext(): PageContextValues {
  return selectLivePageContext(store.getState());
}

/* ------------------------------------------------------------------ *
 * Wegas.Helpers.getState
 * ------------------------------------------------------------------ */

type SetStateFn<T> = (old: T) => T;
type SetState<T> = (stateOrFunction: T | SetStateFn<T>) => void;

let name = 0;

/**
 * Create and init a PageContext state.
 * @param value: initial state value
 *
 * @returns function to update the state
 */
export const getPageState: GlobalHelpersClass['getState'] = <T>(value: T) => {
  const exposeAs = 'state_' + name++;

  const effect = () => {
    dispatch(setStateValue({ exposeAs, value }));
  };

  // call effect right now
  effect();
  // and register it as it will be run again when required
  registerEffect(effect);

  const getState = () => {
    const state = store.getState();

    if (selectIsReloading(state)) {
      throw "Don't do that, please nest getState in some callback";
    }

    return (selectLivePageContext(state).state[exposeAs] as { state: T })
      .state as T;
  };

  const setState: SetState<T> = newState => {
    const state = store.getState();

    if (selectIsReloading(state)) {
      throw "Don't do that, please nest setState in some callback";
    }

    if (typeof newState === 'function') {
      const currentValue = (
        selectLivePageContext(state).state[exposeAs] as { state: T }
      ).state;

      dispatch(
        setStateValue({
          exposeAs,
          value: (newState as SetStateFn<T>)(currentValue),
        }),
      );
    } else {
      dispatch(setStateValue({ exposeAs, value: newState }));
    }
  };

  return [getState, setState];
};
