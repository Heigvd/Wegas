import { globals } from '../Components/Hooks/sandbox';
import {
  defaultLogLevel,
  LoggerLevel,
  loggerLevelSet,
  loggerRegistered,
  selectLogLevels,
} from '../store/slices/logLevels';
import { dispatch, store } from '../store/store';

const LoggerLevels: Record<LoggerLevel, number> = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  LOG: 3,
  INFO: 4,
  DEBUG: 5,
};

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  getLevel: () => LoggerLevel;
  setLevel: (level: LoggerLevel) => void;
  debug: LogFn;
  info: LogFn;
  log: LogFn;
  warn: LogFn;
  error: LogFn;
}

const loggers: Record<string, Logger> = {};

function mapArgs(...args: unknown[]): unknown[] {
  return args.map(arg => {
    if (arg instanceof Error || arg instanceof globals.Error) {
      return arg;
    }
    if (typeof arg === 'function') {
      return arg.toString();
    }
    try {
      return typeof arg === 'object' ? JSON.stringify(arg) : arg;
    } catch {
      return arg;
    }
  });
}

// TODO Evaluate and verify after migration completion
/**
 * This module is imported nearly everywhere, slices included, so it can run
 * while the store module is still being evaluated (import cycle), when `store`
 * is not initialized yet. Until then every logger is at its default level.
 */
function currentLevel(name: string): LoggerLevel {
  try {
    return selectLogLevels(store.getState())[name] ?? defaultLogLevel(name);
  } catch {
    return defaultLogLevel(name);
  }
}

function getLogger(name: string): Logger {
  const logger = loggers[name];
  if (logger == null) {
    // Deferred for the same reason, and because loggers are often created
    // during a render (useLogger), where dispatching would update other
    // components mid-render.
    queueMicrotask(() => dispatch(loggerRegistered(name)));

    const getLevel = () => currentLevel(name);

    const prefix = '[' + name + ']';
    const logger: Logger = {
      getLevel,
      setLevel: (level: LoggerLevel) => {
        dispatch(loggerLevelSet({ loggerName: name, level }));
      },
      debug: (...params: unknown[]): void => {
        const currentLevel = LoggerLevels[getLevel()];
        if (currentLevel >= LoggerLevels.DEBUG) {
          // eslint-disable-next-line no-console
          console.log(prefix, ...mapArgs(...params));
        }
      },
      info: (...params: unknown[]): void => {
        const currentLevel = LoggerLevels[getLevel()];
        if (currentLevel >= LoggerLevels.INFO) {
          // eslint-disable-next-line no-console
          console.log(prefix, ...mapArgs(...params));
        }
      },
      log: (...params: unknown[]): void => {
        const currentLevel = LoggerLevels[getLevel()];
        if (currentLevel >= LoggerLevels.LOG) {
          // eslint-disable-next-line no-console
          console.log(prefix, ...mapArgs(...params));
        }
      },
      warn: (...params: unknown[]): void => {
        const currentLevel = LoggerLevels[getLevel()];
        if (currentLevel >= LoggerLevels.WARN) {
          // eslint-disable-next-line no-console
          console.warn(prefix, ...mapArgs(...params));
        }
      },
      error: (...params: unknown[]): void => {
        const currentLevel = LoggerLevels[getLevel()];
        if (currentLevel >= LoggerLevels.ERROR) {
          // eslint-disable-next-line no-console
          console.error(prefix, ...mapArgs(...params));
        }
      },
    };
    loggers[name] = logger;
    return logger;
  } else {
    return logger;
  }
}

export { getLogger };

//export const wconsole =
//  (csl: (message?: unknown, ...optionalParams: unknown[]) => void) =>
//    (message?: unknown, ...optionalParams: unknown[]): void => {
//      if (process.env.NODE_ENV !== 'production') {
//        if (optionalParams.length === 0) {
//          csl(message);
//        } else {
//          csl(message, optionalParams);
//        }
//      }
//    };

export const wlog = (message?: unknown, ...optionalParams: unknown[]): void =>
  getLogger('default').log(message, ...optionalParams);

export const wwarn = (message?: unknown, ...optionalParams: unknown[]): void =>
  getLogger('default').warn(message, ...optionalParams);

export const werror = (message?: unknown, ...optionalParams: unknown[]): void =>
  getLogger('default').error(message, ...optionalParams);

export const useLogger = (name: string) => {
  getLogger(name);
};
