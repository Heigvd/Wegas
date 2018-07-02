import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk, { ThunkMiddleware, ThunkAction } from 'redux-thunk';
import reducers, { State } from './Reducer/reducers';
// import { update } from './Reducer/actions';
import { Actions } from '.';
import WebSocketListener from '../API/websocket';
import { StateActions } from './actions';
import { createReduxContext } from './connectStore';

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
  // store.dispatch(update([CurrentGM]));
  store.dispatch(Actions.VariableDescriptorActions.getAll());
  store.dispatch(Actions.VariableInstanceActions.getAll());
  store.dispatch(Actions.PageActions.getDefault());
}
storeInit();
new WebSocketListener(
  PusherApp.applicationKey,
  PusherApp.authEndpoint,
  PusherApp.cluster,
);

export const { StoreConsumer, StoreProvider } = createReduxContext(store);
export type ThunkResult<R = void> = ThunkAction<
  R,
  State,
  undefined,
  StateActions
>;

export type StoreDispatch = typeof store.dispatch;
