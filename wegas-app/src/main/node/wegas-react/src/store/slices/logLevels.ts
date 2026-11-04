/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export const LoggerLevelValues = [
  'OFF',
  'ERROR',
  'WARN',
  'LOG',
  'INFO',
  'DEBUG',
] as const;

export type LoggerLevel = typeof LoggerLevelValues[number];

/**
 * The level of every logger created with Helper/wegaslog's getLogger, by name.
 * Listed and changed from the editor's Header ("Loggers" menu).
 */
export type LogLevelsState = Record<string, LoggerLevel>;

/** The level a logger starts at: 'default' (wlog, wwarn, werror) logs more. */
export const defaultLogLevel = (loggerName: string): LoggerLevel =>
  loggerName === 'default' ? 'LOG' : 'WARN';

const initialState: LogLevelsState = {
  default: defaultLogLevel('default'),
};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const logLevelsSlice = createSlice({
  name: 'logLevels',
  initialState,
  reducers: {
    /** Make a logger known at its default level; no-op if it already is. */
    loggerRegistered(state, action: PayloadAction<string>) {
      if (state[action.payload] === undefined) {
        state[action.payload] = defaultLogLevel(action.payload);
      }
    },
    loggerLevelSet(
      state,
      action: PayloadAction<{ loggerName: string; level: LoggerLevel }>,
    ) {
      state[action.payload.loggerName] = action.payload.level;
    },
  },
});

export const { loggerRegistered, loggerLevelSet } = logLevelsSlice.actions;
export default logLevelsSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectLogLevels = (s: RootState): LogLevelsState => s.logLevels;