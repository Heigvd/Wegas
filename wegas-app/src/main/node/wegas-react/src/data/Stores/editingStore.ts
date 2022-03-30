import produce from 'immer';
import { applyMiddleware, compose, createStore, Reducer } from 'redux';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../connectStore';
import {
  EditingState,
  EditingStateActions,
  editorManagement,
  eventManagement,
} from '../Reducer/editingState';

const defaultEditingState: EditingState = {
  events: [],
};

const composeEnhancers: typeof compose =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/**
 * Reducer for edition's state
 *
 * @param {any} [state=u({}, { currentGameModelId: CurrentGM.id })]
 * @param {StateActions} action
 * @returns {Readonly<EditingState>}
 */
export const editingStateReducer: Reducer<Readonly<EditingState>> = produce(
  (state: EditingState, action: EditingStateActions) => {
    state.events = eventManagement(state, action);
    state.editing = editorManagement(state, action);
    return state;
  },
  defaultEditingState,
);

export const editingStoreFactory = () =>
  createStore(
    editingStateReducer,
    composeEnhancers(
      applyMiddleware(
        thunk as ThunkMiddleware<EditingState, EditingStateActions>,
      ),
    ),
  );

export const editingStore = editingStoreFactory();

export const { useStore: useEditingStore } = createStoreConnector(editingStore);

export type EditingStoreDispatch = typeof editingStore.dispatch;

export type EditingThunkResult<R = void> = ThunkAction<
  R,
  EditingState,
  undefined,
  EditingStateActions
>;
