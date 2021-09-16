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
};

type PagesContextActions<
  A extends keyof typeof pagesContextActionCreator = keyof typeof pagesContextActionCreator,
> = ReturnType<typeof pagesContextActionCreator[A]>;

interface PagesContextState {
  [exposeAs: string]: unknown;
}

const pagesContextStateReducer: Reducer<Readonly<PagesContextState>> = u(
  (state: PagesContextState, action: PagesContextActions) => {
    switch (action.type) {
      case 'CONTEXT_SET': {
        const { exposeAs, value } = action.payload;
        state[exposeAs] = { state: value };
      }
    }
    return state;
  },
  {},
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
