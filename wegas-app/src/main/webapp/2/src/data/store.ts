import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk, { ThunkMiddleware, ThunkAction } from 'redux-thunk';
import reducers, { State } from './Reducer/reducers';
import { Actions } from '.';
import { StateActions } from './actions';
import { createReduxContext } from './connectStore';
import { Page } from './selectors';
import '../API/websocket';

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
  store.dispatch(Actions.PageActions.getDefault()).then(() => {
    const defaultId = Page.selectDefaultId();
    if (defaultId) {
      store.dispatch(Actions.EditorActions.pageLoadId(defaultId));
    }
  });
}
storeInit();

export const { StoreConsumer, StoreProvider } = createReduxContext(store);
export type ThunkResult<R = void> = ThunkAction<
  R,
  State,
  undefined,
  StateActions
>;

export type StoreDispatch = typeof store.dispatch;
