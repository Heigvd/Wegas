interface GlobalHelpersClass {
  cloneDeep: <T>(className: T | Readonly<T>) => T;
  uniq: <T>(array: T[] | null | undefined) => T[];
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
