/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from '../store';
import reducer, {
  ConnectionState,
  lockChanged,
  pusherStatusChanged,
  selectIsLocked,
  selectServerStatus,
  selectSocketId,
  serverStatusChanged,
} from './connection';

/**
 * `RootState` is imported as a *type only*, so this spec never loads the store
 * module (and none of the app it drags in). The cast is the price.
 */
const wrap = (connection: ConnectionState) =>
  ({ connection } as unknown as RootState);

const initial = () => reducer(undefined, { type: 'unrelated/action' });

describe('connection slice', () => {
  it('starts disconnected, READY, with no locks and no socket id', () => {
    const s = initial();

    expect(s.pusherStatus).toEqual({ status: 'disconnected' });
    expect(selectServerStatus(wrap(s))).toBe('READY');
    expect(selectSocketId(wrap(s))).toBeUndefined();
    expect(s.locks).toEqual({});
  });

  it('stores the pusher status and exposes the socket id', () => {
    const s = reducer(
      initial(),
      pusherStatusChanged({ status: 'connected', socket_id: '123.456' }),
    );

    expect(s.pusherStatus.status).toBe('connected');
    expect(selectSocketId(wrap(s))).toBe('123.456');
  });

  it('stores the server lifecycle status', () => {
    const s = reducer(initial(), serverStatusChanged('OUTDATED'));

    expect(selectServerStatus(wrap(s))).toBe('OUTDATED');
  });

  it('locks and unlocks a token', () => {
    const locked = reducer(
      initial(),
      lockChanged({ token: 'tok', status: 'lock' }),
    );
    expect(selectIsLocked(wrap(locked), 'tok')).toBe(true);
    expect(selectIsLocked(wrap(locked), 'other')).toBe(false);

    const unlocked = reducer(
      locked,
      lockChanged({ token: 'tok', status: 'unlock' }),
    );
    expect(selectIsLocked(wrap(unlocked), 'tok')).toBe(false);
  });

  it('never reports a lock without a token', () => {
    expect(selectIsLocked(wrap(initial()), undefined)).toBe(false);
  });
});