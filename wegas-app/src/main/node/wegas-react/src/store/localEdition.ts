/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import * as React from 'react';
import { AnyAction } from 'redux';
import editionReducer, {
  Edition,
  initialEditionState,
} from './slices/edition';
import { AppDispatch, AppThunk, RootState, store } from './store';

/**
 * A dispatch bound to an edition scope: either the app store's own dispatch
 * (the main editor) or the one returned by useLocalEdition (a nested form).
 *
 * Components that can be rendered in both places take one of these rather than
 * an AppDispatch, to make the choice of scope visible in their signature.
 */
export type EditingDispatch = AppDispatch;

/**
 * Component-scoped edition state, replacing `editingStoreFactory()`.
 *
 * A page component that embeds its own mini editor (ComponentWithForm, the
 * state machine widget) must be able to have a selection of its own without
 * clobbering the main editor's — including its unsaved changes. The two are
 * shown side by side, see the globalSelection / localSelection styles.
 *
 * Only the edition is scoped: the event log is global (the notification menu is
 * its only reader), so nested forms read `editorEvents` straight from the store.
 */
export function useLocalEdition(): {
  edition: Edition | undefined;
  dispatch: EditingDispatch;
} {
  const [state, rawDispatch] = React.useReducer(
    editionReducer,
    initialEditionState,
  );

  // Latest-value ref so thunks dispatched into this scope observe the current
  // edition rather than the one captured when `dispatch` was created.
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const dispatch = React.useMemo(() => {
    const localDispatch = (action: AnyAction | AppThunk<unknown>): unknown => {
      if (typeof action === 'function') {
        // Hand the thunk a complete app state with only `edition` swapped for
        // this scope's own, so it stays a plain AppThunk and never needs to
        // know which scope it runs in.
        const getState = (): RootState => ({
          ...store.getState(),
          edition: stateRef.current,
        });
        return action(localDispatch as AppDispatch, getState, undefined);
      }
      // A plain action dispatched into this scope reaches only this scope,
      // never the app store -- same as the local editingStore it replaces. It is
      // what makes a nested form's selection independent, and it is why a
      // local-scope thunk's inner `dispatch(manageResponseHandler(...))` is
      // harmless: manageResponseHandler updates the app and old stores itself,
      // and the MANAGED_RESPONSE_ACTION it returns is simply ignored here.
      rawDispatch(action);
      return action;
    };
    return localDispatch as unknown as EditingDispatch;
  }, []);

  return { edition: state.current, dispatch };
}

/**
 * Helper to create a well-typed thunk that can be dispatched into either the app
 * store or a component-local edition scope. Replaces `createEditingAction`.
 */
export function createEditingAction<Payload, ReturnType>(
  cb: (
    payload: Payload,
    dispatch: EditingDispatch,
    getState: () => RootState,
  ) => ReturnType,
): (payload: Payload) => AppThunk<ReturnType> {
  return (payload: Payload) => (dispatch, getState) =>
    cb(payload, dispatch as EditingDispatch, getState);
}
