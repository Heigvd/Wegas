/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { configureStore } from '@reduxjs/toolkit';
import type { ITranslatableContent } from 'wegas-ts-api';
import reducer, {
  addPopup,
  popupAdded,
  popupExpired,
  popupRemoved,
} from './popups';

const message = {
  '@class': 'TranslatableContent',
  translations: {},
} as unknown as ITranslatableContent;

/** A store holding only this slice, under its real key, to run the thunk. */
const makeStore = () => configureStore({ reducer: { popups: reducer } });

afterEach(() => {
  jest.useRealTimers();
});

describe('popups slice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: 'unrelated/action' })).toEqual({});
  });

  it('adds a popup under its id, without storing the id twice', () => {
    const s = reducer(
      undefined,
      popupAdded({ id: 'a', message, timestamp: 1, className: 'c' }),
    );

    expect(s).toEqual({ a: { message, timestamp: 1, className: 'c' } });
  });

  it('removes a popup on dismiss', () => {
    const added = reducer(undefined, popupAdded({ id: 'a', message, timestamp: 1 }));

    expect(reducer(added, popupRemoved('a'))).toEqual({});
  });

  it('expires only the popup its timer was set for', () => {
    const readded = reducer(
      undefined,
      popupAdded({ id: 'a', message, timestamp: 2 }),
    );

    // timer of an earlier popup with the same id
    expect(reducer(readded, popupExpired({ id: 'a', timestamp: 1 }))).toBe(
      readded,
    );
    expect(reducer(readded, popupExpired({ id: 'a', timestamp: 2 }))).toEqual(
      {},
    );
  });

  it('addPopup removes the popup after its duration', () => {
    jest.useFakeTimers();
    const store = makeStore();

    store.dispatch(addPopup('a', message, 1000));
    expect(store.getState().popups.a).toBeDefined();

    jest.advanceTimersByTime(999);
    expect(store.getState().popups.a).toBeDefined();

    jest.advanceTimersByTime(1);
    expect(store.getState().popups.a).toBeUndefined();
  });

  it('addPopup without duration keeps the popup', () => {
    jest.useFakeTimers();
    const store = makeStore();

    store.dispatch(addPopup('a', message));
    jest.runAllTimers();

    expect(store.getState().popups.a).toBeDefined();
  });

  it('re-adding an id restarts its lifetime', () => {
    jest.useFakeTimers();
    const store = makeStore();

    store.dispatch(addPopup('a', message, 1000));
    jest.advanceTimersByTime(600);
    store.dispatch(addPopup('a', message, 1000));
    jest.advanceTimersByTime(600);

    // the first timer fired, but the second popup survives it
    expect(store.getState().popups.a).toBeDefined();

    jest.advanceTimersByTime(400);
    expect(store.getState().popups.a).toBeUndefined();
  });
});