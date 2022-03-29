import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from './store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../connectStore';
import u from 'immer';

const pagesContextActionCreator = {
  CONTEXT_SET: (exposeAs: string, value: unknown) => ({
    type: 'CONTEXT_SET',
    payload: { exposeAs, value },
  }),
  STATE_SET: (exposeAs: string, value: unknown) => ({
    type: 'STATE_SET',
    payload: { exposeAs, value },
  }),
};

type PagesContextActions<
  A extends keyof typeof pagesContextActionCreator = keyof typeof pagesContextActionCreator,
  > = ReturnType<typeof pagesContextActionCreator[A]>;

export interface PagesContextState {
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
    }
    return state;
  },
  { context: {}, state: {}},
);

export const pagesContextStateStore = createStore(
  pagesContextStateReducer,
  composeEnhancers(
    applyMiddleware(
      thunk as ThunkMiddleware<PagesContextState, PagesContextActions>,
    ),
  ),
);

export const { useStore: usePagesContextStateStore } = createStoreConnector(
  pagesContextStateStore,
);

export function setPagesContextState(exposeAs: string, value: unknown) {
  pagesContextStateStore.dispatch(
    pagesContextActionCreator.CONTEXT_SET(exposeAs, value),
  );
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
  const exposeAs = "state_" + name++;

  pagesContextStateStore.dispatch(
    pagesContextActionCreator.STATE_SET(exposeAs, value),
  );

  const getState = () => {
    return (pagesContextStateStore.getState().state[exposeAs] as { state: T })
      .state as T;
  };

  const setState: SetState<T> = newState => {
    if (typeof newState === 'function') {
      const currentValue = (
        pagesContextStateStore.getState().state[exposeAs] as { state: T }
      ).state;
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
}
