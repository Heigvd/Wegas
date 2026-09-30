/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from '../store';
import reducer, {
  defaultLogLevel,
  loggerLevelSet,
  loggerRegistered,
  LogLevelsState,
  selectLogLevels,
} from './logLevels';

/**
 * `RootState` is imported as a *type only*, so this spec never loads the store
 * module (and none of the app it drags in). The cast is the price.
 */
const wrap = (logLevels: LogLevelsState) =>
  ({ logLevels } as unknown as RootState);

const initial = () => reducer(undefined, { type: 'unrelated/action' });

describe('logLevels slice', () => {
  it('starts with only the default logger, at LOG', () => {
    expect(selectLogLevels(wrap(initial()))).toEqual({ default: 'LOG' });
  });

  it('gives new loggers WARN and the default logger LOG', () => {
    expect(defaultLogLevel('LibrariesLoader')).toBe('WARN');
    expect(defaultLogLevel('default')).toBe('LOG');
  });

  it('registers a new logger at its default level', () => {
    expect(reducer(initial(), loggerRegistered('Pages'))).toEqual({
      default: 'LOG',
      Pages: 'WARN',
    });
  });

  it('never resets a level on re-registration', () => {
    const set = reducer(
      initial(),
      loggerLevelSet({ loggerName: 'Pages', level: 'DEBUG' }),
    );

    expect(reducer(set, loggerRegistered('Pages'))).toBe(set);
    expect(reducer(set, loggerRegistered('default'))).toBe(set);
  });

  it('sets a level, including OFF', () => {
    const off = reducer(
      initial(),
      loggerLevelSet({ loggerName: 'default', level: 'OFF' }),
    );

    expect(off.default).toBe('OFF');
  });
});