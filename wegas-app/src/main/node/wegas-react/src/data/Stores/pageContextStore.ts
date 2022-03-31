import * as React from 'react';
import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from './store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../connectStore';
import u from 'immer';
import { registerEffect } from '../../Helper/pageEffectsManager';

const pagesContextActionCreator = {
  CONTEXT_SET: (exposeAs: string, value: unknown) => ({
    type: 'CONTEXT_SET' as const,
    payload: { exposeAs, value },
  }),
  STATE_SET: (exposeAs: string, value: unknown) => ({
    type: 'STATE_SET' as const,
    payload: { exposeAs, value },
  }),
  RELOAD: (reload: boolean) => ({
    type: 'RELOAD' as const,
    payload: { reload },
  }),
};

type PagesContextActions<
  A extends keyof typeof pagesContextActionCreator = keyof typeof pagesContextActionCreator,
> = ReturnType<typeof pagesContextActionCreator[A]>;

export interface PagesContextState {
  reloading: boolean;
  context: {
    [exposeAs: string]: unknown;
  };
  state: {
    [exposeAs: string]: unknown;
  };
}

const pagesContextStateReducer: Reducer<Readonly<PagesContextState>> = u(
  (state: PagesContextState, action: PagesContextActions) => {
    switch (action.type) {
      case 'CONTEXT_SET': {
        const { exposeAs, value } = action.payload;
        state.context[exposeAs] = { state: value };
        break;
      }
      case 'STATE_SET': {
        const { exposeAs, value } = action.payload;
        state.state[exposeAs] = { state: value };
        break;
      }
      case 'RELOAD': {
        state.reloading = action.payload.reload;
        break;
      }
    }
    return state;
  },
  { context: {}, state: {} },
);

export const pagesContextStateStore = createStore(
  pagesContextStateReducer,
  composeEnhancers(
    applyMiddleware(
      thunk as ThunkMiddleware<PagesContextState, PagesContextActions>,
    ),
  ),
);

const { useStore } = createStoreConnector(pagesContextStateStore);

export const usePagesContextStateStore = <R>(
  selector: (store: Readonly<PagesContextState>) => R,
  shouldUpdate?: (oldValue: R, newValue: R) => boolean,
): R | undefined => {
  const ref = React.useRef<R | undefined>();

  return useStore(store => {
    if (!store.reloading) {
      // state is reloading, return the ref
      ref.current = selector(store);
    }
    return ref.current;
  }, shouldUpdate);
};

export function setPagesContextState(exposeAs: string, value: unknown) {
  pagesContextStateStore.dispatch(
    pagesContextActionCreator.CONTEXT_SET(exposeAs, value),
  );
}

export function setReloadingStatus(reload: boolean) {
  pagesContextStateStore.dispatch(pagesContextActionCreator.RELOAD(reload));
}

type SetStateFn<T> = (old: T) => T;
type SetState<T> = (stateOrFunction: T | SetStateFn<T>) => void;

let name = 0;

/**
 * Create and init a PageContext state.
 * @param exposeAs state will be exposed as "Context[esposeAs]" in client scripts
 * @param value: initial state value
 *
 * @returns function to update the state
 */
export const getPageState: GlobalHelpersClass['getState'] = <T>(value: T) => {
  //export const getPageState: GlobalHelpersClass['getState'] = <T>(value: T) => {
  const exposeAs = 'state_' + name++;

  const effect = () => {
    pagesContextStateStore.dispatch(
      pagesContextActionCreator.STATE_SET(exposeAs, value),
    );
  };
  // call effect right now
  effect();
  // and register it as it will be run again when required
  registerEffect(effect);

  const getState = () => {
    const state = pagesContextStateStore.getState();
    if (state.reloading) {
      throw "Don't do that, please nest getState in some callback";
    }
    return (pagesContextStateStore.getState().state[exposeAs] as { state: T })
      .state as T;
  };

  const setState: SetState<T> = newState => {
    const state = pagesContextStateStore.getState();
    if (state.reloading) {
      throw "Don't do that, please nest setState in some callback";
    }
    if (typeof newState === 'function') {
      const currentValue = (state.state[exposeAs] as { state: T }).state;
      const newValue = (newState as SetStateFn<T>)(currentValue);
      pagesContextStateStore.dispatch(
        pagesContextActionCreator.STATE_SET(exposeAs, newValue),
      );
    } else {
      pagesContextStateStore.dispatch(
        pagesContextActionCreator.STATE_SET(exposeAs, newState),
      );
    }
  };

  return [getState, setState];
};
