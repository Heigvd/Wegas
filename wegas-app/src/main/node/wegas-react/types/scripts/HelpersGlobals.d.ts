interface GlobalHelpersClass {
  cloneDeep: <T>(className: T | Readonly<T>) => T;
  uniq: <T>(array: T[] | null | undefined) => T[];
}
