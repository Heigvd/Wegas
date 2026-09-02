import { produce } from 'immer';
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
 * TODO Remove once migration complete - temporary
 * True until this module finishes evaluating, i.e. until `editingStore` below
 * has been constructed. Read by the reducer — see the comment there.
 */
let moduleEvaluating = true;

/**
 * Reducer for edition's state
 *
 * @param {any} [state=produce({}, { currentGameModelId: CurrentGM.id })]
 * @param {StateActions} action
 * @returns {Readonly<EditingState>}
 */
export const editingStateReducer: Reducer<Readonly<EditingState>> = produce(
  (state: EditingState, action: EditingStateActions) => {
    // TODO Remove once migration complete - temporary
    // `createStore` below dispatches synchronously while this module is still
    // evaluating. data/Reducer/editingState — which owns both handlers called
    // here — is part of a large import cycle through this file, so at that point
    // it can still be mid-initialization with its own imports unassigned, and
    // calling into it throws. Any dispatch arriving this early is a
    // store-construction artefact and is a no-op here anyway: the initial state
    // comes from produce's base value.
    if (moduleEvaluating) {
      return state;
    }
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

// TODO Remove once migration complete - temporary
// Module graph is settled past this point: real dispatches must reach the handlers.
moduleEvaluating = false;

export const { useStore: useEditingStore } = createStoreConnector(editingStore);

export type EditingStoreDispatch = typeof editingStore.dispatch;

export type EditingThunkResult<R = void> = ThunkAction<
  R,
  EditingState,
  undefined,
  EditingStateActions
>;

/**
 * Helper to create well-typed actions easily
 */
export function createEditingAction<Payload, ReturnType>(
  cb: (
    payload: Payload,
    dispatch: EditingStoreDispatch,
    getState: () => EditingState,
  ) => ReturnType,
): (payload: Payload) => EditingThunkResult<ReturnType> {
  return (payload: Payload) => {
    return (dispatch: EditingStoreDispatch, getState: () => EditingState) => {
      return cb(payload, dispatch, getState);
    };
  };
}
