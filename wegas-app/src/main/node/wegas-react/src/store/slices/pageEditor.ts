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
 * Types (moved verbatim from Editor/Components/Page/PageEditor.tsx)
 * ------------------------------------------------------------------ */

export interface FocusedComponent {
  pageId: string;
  componentPath: number[];
}

export interface PageEditorState {
  focused?: FocusedComponent;
  /**
   * `focused` flattened to a comparable string. Kept alongside the structured
   * value so the per-component selector is a single `===` instead of the two
   * `JSON.stringify` calls the old `isComponentFocused` ran: this selector
   * runs once per mounted page component on every store dispatch.
   */
  focusKey?: string;
}

const initialState: PageEditorState = {};

/** Must stay pure and dependency-free: also called from render paths. */
export function focusKeyOf(pageId: string, componentPath: number[]): string {
  return `${pageId}/${componentPath.join('.')}`;
}

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const pageEditorSlice = createSlice({
  name: 'pageEditor',
  initialState,
  reducers: {
    setFocused(state, action: PayloadAction<FocusedComponent>) {
      const key = focusKeyOf(
        action.payload.pageId,
        action.payload.componentPath,
      );
      // mouseover bubbles through the child nodes of a same component
      if (state.focusKey === key) {
        return;
      }
      state.focused = action.payload;
      state.focusKey = key;
    },
    unsetFocused(state) {
      if (state.focusKey === undefined) {
        return;
      }
      state.focused = undefined;
      state.focusKey = undefined;
    },
  },
});

export const { setFocused, unsetFocused } = pageEditorSlice.actions;
export default pageEditorSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectFocusedComponent = (s: RootState) => s.pageEditor.focused;
export const selectFocusKey = (s: RootState) => s.pageEditor.focusKey;
