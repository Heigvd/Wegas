import { globals } from '../Components/Hooks/sandbox';
import { ActionCreator } from '../data/actions';
import { LoggerLevel } from '../data/Reducer/globalState';
import { store } from '../data/Stores/store';

const LoggerLevels: Record<LoggerLevel, number> = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  LOG: 3,
  INFO: 4,
  DEBUG: 5,
};

type LogFn = (...args: unknown[]) => void;

interface Logger {
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

function getLogger(name: string): Logger {
  const logger = loggers[name];
  if (logger == null) {
    const level = store.getState().global.logLevels[name];
    if (level == undefined) {
      store.dispatch(
        ActionCreator.LOGGER_LEVEL_SET({
          loggerName: name,
          level: 'WARN',
        }),
      );
    }

    const getLevel = () => {
      return store.getState().global.logLevels[name];
    };

    // let currentLevel: LoggerLevel = LoggerLevels.WARN;
    const prefix = '[' + name + ']';
    const logger: Logger = {
      getLevel,
      setLevel: (level: LoggerLevel) => {
        store.dispatch(
          ActionCreator.LOGGER_LEVEL_SET({
            loggerName: name,
            level: level,
          }),
        );
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
