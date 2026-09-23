/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { managedResponseReceived } from '../actions';
import type { RootState } from '../store';

/**
 * The editor's event log: server exceptions, script errors and client-side
 * errors, as shown by the notification menu in the editor header.
 *
 * `timestamp` doubles as the identity key: it is what read/dismiss target.
 */
export interface EditorEventsState {
  events: WegasEvent[];
}

const initialState: EditorEventsState = { events: [] };

const editorEventsSlice = createSlice({
  name: 'editorEvents',
  initialState,
  reducers: {
    editorEventAdded(state, action: PayloadAction<WegasEvent>) {
      state.events.push(action.payload);
    },
    editorEventRemoved(state, action: PayloadAction<{ timestamp: number }>) {
      const index = state.events.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (index !== -1) {
        state.events.splice(index, 1);
      }
    },
    editorEventRead(state, action: PayloadAction<{ timestamp: number }>) {
      const index = state.events.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (index !== -1) {
        // immer produces the new array and object references that the old
        // reducer had to fake with cloneDeep + slice.
        state.events[index].unread = false;
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(managedResponseReceived, (state, action) => {
      if (action.payload.events.length > 0) {
        state.events.push(...action.payload.events);
      }
    });
  },
});

export const selectEditorEvents = (state: RootState) =>
  state.editorEvents.events;

export const { editorEventAdded, editorEventRemoved, editorEventRead } =
  editorEventsSlice.actions;

export default editorEventsSlice.reducer;
