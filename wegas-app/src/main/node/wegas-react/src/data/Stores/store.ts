import { applyMiddleware, compose, createStore } from 'redux';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
// import '../../API/websocket';
import { ActionCreator, StateActions } from '../actions';
import { createStoreConnector } from '../connectStore';
import { dispatch, store as appStore } from '../../store/store';
import { selectScriptRegistry } from '../../store/slices/scriptRegistry';
import { getTeams } from '../../store/slices/teams';
import { getGame } from '../../store/slices/game';
import { getGameModel } from '../../store/slices/gameModel';
import { getAll as getAllVariableDescriptors } from '../../store/slices/variableDescriptors';
import { getAll as getAllVariableInstances } from '../../store/slices/variableInstances';
import { getAll as getAllPages } from '../../store/slices/pages';

// Used by redux dev tool extension
const composeEnhancers: typeof compose =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/**
 * The old store holds no state any more: every slice lives in the react-redux
 * store (store/store). It survives only as a notifier for the remaining
 * `useStore` subscribers, which read the react-redux store imperatively and
 * re-run on MANAGED_RESPONSE_ACTION / SCRIPT_REGISTRY_CHANGED. Removed once
 * they are migrated (Phase 4-6).
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type State = {};
const legacyState: State = {};
const legacyReducer = (state: State = legacyState) => state;

export const store = createStore(
  legacyReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<State, StateActions>),
  ),
);
function storeInit() {
  bridgeScriptRegistry();
  dispatch(getAllVariableDescriptors());
  dispatch(getAllVariableInstances());
  dispatch(getAllPages());
  dispatch(getTeams());
  dispatch(getGame());
  dispatch(getGameModel(CurrentGM.id!));
}

/**
 * TEMPORARY, until Phase 4 moves them to react-redux: useScript, and the other
 * old-store `useStore` subscribers that evaluate client scripts, must re-run
 * when a script registers a client method, schema, page loader... They used to,
 * because those registrations were old-store actions.
 */
function bridgeScriptRegistry() {
  let lastRegistry = selectScriptRegistry(appStore.getState());
  appStore.subscribe(() => {
    const registry = selectScriptRegistry(appStore.getState());
    if (registry !== lastRegistry) {
      lastRegistry = registry;
      store.dispatch(ActionCreator.SCRIPT_REGISTRY_CHANGED());
    }
  });
}
// This module participates in a circular import with the new react-redux store
// (store/store → slices → API/rest → data/Stores/store, and data/actions →
// store/store for the managed-response fan-out). Running storeInit synchronously
// at module-eval time executes it mid-cycle — while `store` here and the new
// store's `dispatch` are still being constructed (and API/rest's `store` binding
// is not yet populated). Deferring the whole bootstrap by one microtask lets the
// entire module graph finish initializing first.
void Promise.resolve().then(storeInit);

export const { StoreConsumer, useStore, getDispatch } =
  createStoreConnector(store);
export type ThunkResult<R = void> = ThunkAction<
  R,
  State,
  undefined,
  StateActions
>;

export type StoreDispatch = typeof store.dispatch;
