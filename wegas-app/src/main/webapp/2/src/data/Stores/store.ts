import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk, { ThunkMiddleware, ThunkAction } from 'redux-thunk';
import reducers, { State } from '../Reducer/reducers';
import { Actions } from '..';
import { StateActions } from '../actions';
import { createStoreConnector } from '../connectStore';
import '../../API/websocket';

// Used by redux dev tool extension
export const composeEnhancers: typeof compose =
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
  store.dispatch(Actions.TeamActions.getTeams());
  store.dispatch(Actions.EditorActions.getLanguage());
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
