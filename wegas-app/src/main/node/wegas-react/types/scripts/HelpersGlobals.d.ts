interface GlobalHelpersClass {
  cloneDeep: <T>(className: T | Readonly<T>) => T;
  uniq: <T>(array: T[] | null | undefined) => T[];
  getState: <T>(initialValue: T) => [() => T, (stateOfFunction : T | ((oldValue: T) => T)) => void];
  /**
   * Register a function that will be executed once the clientScript context has been fully initialized.
   */
  registerEffect: (effect : () => void) => void;
  getFilePath: (relativePath) => string;
  getLogger: (name: string) => {
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    getLevel: () => 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG';
    setLevel: (l: 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG' ) => void;
  };
}
