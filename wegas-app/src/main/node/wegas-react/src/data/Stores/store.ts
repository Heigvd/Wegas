import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
import { Actions } from '..';
// import '../../API/websocket';
import { StateActions } from '../actions';
import { createStoreConnector } from '../connectStore';
import reducers, { State } from '../Reducer/reducers';
import { dispatch } from '../../store/store';
import { getGame } from '../../store/slices/game';
import { getGameModel } from '../../store/slices/gameModel';

// Used by redux dev tool extension
const composeEnhancers: typeof compose =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  combineReducers<State, StateActions>(reducers),
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<State, StateActions>),
  ),
);
function storeInit() {
  store.dispatch(Actions.VariableDescriptorActions.getAll());
  store.dispatch(Actions.VariableInstanceActions.getAll());
  store.dispatch(Actions.PageActions.getAll());
  store.dispatch(Actions.TeamActions.getTeams());
  store.dispatch(Actions.EditorActions.getEditorLanguage());
  dispatch(getGame());
  dispatch(getGameModel(CurrentGM.id!));
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
