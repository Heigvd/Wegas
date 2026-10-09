/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ITranslatableContent } from 'wegas-ts-api';
import type { AppThunk, RootState } from '../store';

export interface Popup {
  /**
   * message - the message of the popup
   */
  message: ITranslatableContent;
  /**
   * timestamp - the timestamp when the popup was registered
   */
  timestamp: number;
  /**
   * duration - the duration of the popup in milliseconds
   */
  duration?: number;
  /**
   * className - class to apply to the popup
   */
  className?: string;
}

/**
 * Transient messages shown on top of the app (PopupManager), raised by the app
 * itself and by client scripts through `Popups.addPopup`.
 */
export type PopupsState = { [id: string]: Popup };

const initialState: PopupsState = {};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const popupsSlice = createSlice({
  name: 'popups',
  initialState,
  reducers: {
    /** Adding an existing id replaces that popup. */
    popupAdded(state, action: PayloadAction<Popup & { id: string }>) {
      const { id, ...popup } = action.payload;
      state[id] = popup;
    },
    popupRemoved(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    /**
     * Timed removal: only removes the popup the timer was set for, so a popup
     * re-added under the same id does not vanish on the previous one's timer.
     */
    popupExpired(
      state,
      action: PayloadAction<{ id: string; timestamp: number }>,
    ) {
      const { id, timestamp } = action.payload;
      if (state[id]?.timestamp === timestamp) {
        delete state[id];
      }
    },
  },
});

export const { popupAdded, popupRemoved, popupExpired } = popupsSlice.actions;
export default popupsSlice.reducer;

/**
 * Show a popup, removed after `duration` ms when given, else on user dismiss.
 */
export const addPopup =
  (
    id: string,
    message: ITranslatableContent,
    duration?: number,
    className?: string,
  ): AppThunk =>
  dispatch => {
    const timestamp = new Date().getTime();
    dispatch(popupAdded({ id, message, duration, timestamp, className }));
    if (duration != null) {
      setTimeout(() => dispatch(popupExpired({ id, timestamp })), duration);
    }
  };

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectPopups = (s: RootState): PopupsState => s.popups;