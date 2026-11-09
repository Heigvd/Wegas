/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/**
 * The values client scripts see as `Context`.
 *
 * Both maps hold `{ state: value }` wrappers rather than bare values: that shape
 * is part of the scripting API (`Context.myVar.state`, and `.setState` which
 * `addSetterToState` adds on the fly), so it must not be flattened.
 *
 * Values are whatever a client script returned -- any JS value, including
 * functions and class instances. Hence the `unknown` and the middleware
 * exemptions in `store/store.ts`.
 */
export interface PageContextValues {
  /** Written by `<State>` page components (one entry per `exposeAs`). */
  context: {
    [exposeAs: string]: unknown;
  };
  /** Written by the `Wegas.Helpers.getState` effects (`state_0`, `state_1`, ...). */
  state: {
    [exposeAs: string]: unknown;
  };
}

export interface PageContextState {
  /**
   * Live values. Always up to date, including while client scripts are being
   * re-evaluated -- library evaluation itself needs to read them as they are
   * rebuilt.
   */
  values: PageContextValues;
  /**
   * `values` captured at the start of a client-script reload, and the view React
   * consumers get for as long as the reload lasts (see `selectPublishedPageContext`).
   *
   * `undefined` outside a reload, which also makes it the single source of truth
   * for "are we reloading" -- see `selectIsReloading`.
   */
  frozen?: PageContextValues;
}

const initialState: PageContextState = {
  values: { context: {}, state: {} },
};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const pageContextSlice = createSlice({
  name: 'pageContext',
  initialState,
  reducers: {
    setContextValue(
      state,
      action: PayloadAction<{ exposeAs: string; value: unknown }>,
    ) {
      const { exposeAs, value } = action.payload;
      state.values.context[exposeAs] = { state: value };
    },
    setStateValue(
      state,
      action: PayloadAction<{ exposeAs: string; value: unknown }>,
    ) {
      const { exposeAs, value } = action.payload;
      state.values.state[exposeAs] = { state: value };
    },
    /**
     * Open (`true`) or close (`false`) a client-script reload window.
     *
     * Opening captures `values`. Assigning one draft into another makes immer
     * resolve both keys to the *same* object, so the capture costs no copy: the
     * next write to `values` copies that branch and leaves `frozen` pointing at
     * the pre-reload object.
     *
     * The capture is guarded so that a reentrant `setReloading(true)` cannot
     * replace the snapshot with half-rebuilt values.
     */
    setReloading(state, action: PayloadAction<boolean>) {
      if (action.payload) {
        if (state.frozen === undefined) {
          state.frozen = state.values;
        }
      } else {
        state.frozen = undefined;
      }
    },
  },
});

export const { setContextValue, setStateValue, setReloading } =
  pageContextSlice.actions;
export default pageContextSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

/**
 * What React consumers must read: the live values, except while client scripts
 * are reloading, where it is the snapshot taken before the reload started.
 *
 * Freezing the *published* view -- rather than suppressing the writes -- is what
 * keeps page components from re-evaluating their scripts against a half-rebuilt
 * context. The returned reference is stable for the whole reload window, so
 * consumers do not even re-render.
 */
export const selectPublishedPageContext = (s: RootState): PageContextValues =>
  s.pageContext.frozen ?? s.pageContext.values;

/**
 * The live values, ignoring any reload in progress. For the non-React callers
 * that evaluate scripts imperatively -- notably client-library evaluation, which
 * runs *during* a reload and must see the values it is itself producing.
 */
export const selectLivePageContext = (s: RootState): PageContextValues =>
  s.pageContext.values;

/** True while a client-script reload window is open. */
export const selectIsReloading = (s: RootState): boolean =>
  s.pageContext.frozen !== undefined;
