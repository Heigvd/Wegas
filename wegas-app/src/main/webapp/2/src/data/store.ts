import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import reducers, { State } from './Reducer/reducers';
// import { update } from './Reducer/actions';
import { Actions } from './index';
import WebSocketListener from '../API/websocket';

// Used by redux dev tool extension
const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore<State>(
  combineReducers<State>(reducers),
  composeEnhancers(applyMiddleware(thunk)),
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
