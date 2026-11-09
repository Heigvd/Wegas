/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LockEventData } from '../../API/websocket';
import type { RootState } from '../store';

export type WegasStatus = 'DOWN' | 'READY' | 'OUTDATED';

/**
 * Link state with the server: the pusher socket, the server lifecycle and the
 * locks pushed through the websocket. Written from outside React only
 * (API/websocket).
 */
export interface ConnectionState {
  pusherStatus: {
    status: string;
    /** Sent as the `SocketId` header so the server skips echoing our own changes. */
    socket_id?: string;
  };
  serverStatus: WegasStatus;
  locks: { [token: string]: boolean };
}

const initialState: ConnectionState = {
  pusherStatus: { status: 'disconnected' },
  serverStatus: 'READY',
  locks: {},
};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    pusherStatusChanged(
      state,
      action: PayloadAction<{ status: string; socket_id?: string }>,
    ) {
      state.pusherStatus = action.payload;
    },
    serverStatusChanged(state, action: PayloadAction<WegasStatus>) {
      state.serverStatus = action.payload;
    },
    lockChanged(
      state,
      action: PayloadAction<Pick<LockEventData, 'token' | 'status'>>,
    ) {
      state.locks[action.payload.token] = action.payload.status === 'lock';
    },
  },
});

export const { pusherStatusChanged, serverStatusChanged, lockChanged } =
  connectionSlice.actions;
export default connectionSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 *
 * They take the state explicitly (no store default) so this module never loads
 * the store; imperative callers pass `store.getState()`.
 * ------------------------------------------------------------------ */

export const selectSocketId = (s: RootState): string | undefined =>
  s.connection.pusherStatus.socket_id;

export const selectServerStatus = (s: RootState): WegasStatus =>
  s.connection.serverStatus;

export const selectIsLocked = (s: RootState, token?: string): boolean =>
  token != null && s.connection.locks[token] === true;