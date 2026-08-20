import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
import { Actions } from '..';
// import '../../API/websocket';
import { StateActions } from '../actions';
import { createStoreConnector } from '../connectStore';
import reducers, { State } from '../Reducer/reducers';
import { dispatch } from '../../store/store';
import { getTeams } from '../../store/slices/teams';

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
  store.dispatch(Actions.GameActions.getGame());
  // TODO teams migration: this dispatch only lives here because gameId/teamId
  // still come from this store's `global` slice. Once `global` moves to the
  // react-redux store, move this call (and storeInit as a whole) there too.
  dispatch(
    getTeams({
      gameId: store.getState().global.currentGameId,
      teamId: store.getState().global.currentTeamId,
    }),
  );
  store.dispatch(Actions.EditorActions.getEditorLanguage());
  store.dispatch(Actions.GameModelActions.getGameModel(CurrentGM.id!));
}
storeInit();

export const { StoreConsumer, useStore, getDispatch } =
  createStoreConnector(store);
export type ThunkResult<R = void> = ThunkAction<
  R,
  State,
  undefined,
  StateActions
>;

export type StoreDispatch = typeof store.dispatch;
