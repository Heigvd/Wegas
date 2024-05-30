interface GlobalHelpersClass {
  cloneDeep: <T>(className: T | Readonly<T>) => T;
  isEqual: (value: any, other: any) => boolean;
  uniq: <T>(array: T[] | null | undefined) => T[];
  escapeRegExp: (s?: string) => string;
  useRef: <T>(id: string, value: T) => { current: T };
  getState: <T>(
    initialValue: T,
  ) => [() => T, (stateOfFunction: T | ((oldValue: T) => T)) => void];
  /**
   * Register a function that will be executed once the clientScript context has been fully initialized.
   */
  registerEffect: (effect: () => void) => void;
  getFilePath: (absolutePath: string) => string;
  downloadFile: <T extends 'JSON' | 'TEXT' | 'BLOB'>(absolutePath: string, fileType : T) => Promise<T extends 'JSON'? unknown : (T extends 'BLOB' ? Blob : string)>;
  getLogger: (name: string) => {
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    getLevel: () => 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG';
    setLevel: (l: 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG') => void;
  };
  downloadDataAsFile: (filename: string, data: string) => void;
  getWegasUrl: () => string;
  scrollIntoView: (selector: string, options: ScrollIntoViewOptions) => void;
}
