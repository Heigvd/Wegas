/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import {
  addEventHandler,
  removeEventHandler,
  triggerEventHandlers,
} from './eventHandlers';

const customEvent = {
  '@class': 'CustomEvent',
  timestamp: 1,
  unread: true,
} as unknown as WegasEvent;

describe('eventHandlers', () => {
  afterEach(() => {
    removeEventHandler('CustomEvent', 'a');
    removeEventHandler('CustomEvent', 'b');
  });

  it('calls every handler of the event type, and only those', () => {
    const a = jest.fn();
    const b = jest.fn();
    const other = jest.fn();
    addEventHandler('CustomEvent', 'a', a);
    addEventHandler('CustomEvent', 'b', b);
    addEventHandler('ExceptionEvent', 'a', other);

    triggerEventHandlers(customEvent);

    expect(a).toHaveBeenCalledWith(customEvent);
    expect(b).toHaveBeenCalledWith(customEvent);
    expect(other).not.toHaveBeenCalled();
    removeEventHandler('ExceptionEvent', 'a');
  });

  it('keeps the first handler registered under an id', () => {
    const first = jest.fn();
    const second = jest.fn();
    addEventHandler('CustomEvent', 'a', first);
    addEventHandler('CustomEvent', 'a', second);

    triggerEventHandlers(customEvent);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('stops calling a removed handler', () => {
    const a = jest.fn();
    addEventHandler('CustomEvent', 'a', a);
    removeEventHandler('CustomEvent', 'a');

    triggerEventHandlers(customEvent);

    expect(a).not.toHaveBeenCalled();
  });
});