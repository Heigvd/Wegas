declare module 'updeep' {
  interface Updeep {
    <T, U>(update: U | ((src: T) => U), src: T): Readonly<T & U>;
    map<T>(iteratee: ((o: T, k: number) => T), obj: T[]): Readonly<T[]>;
    map<T>(
      iteratee: ((o: T, k: string) => T),
      obj: { [key: string]: T },
    ): Readonly<{ [key: string]: T }>;
    if<T, U>(
      predicate: ((obj: T) => boolean),
      update: U | ((src: T) => T),
      src: T,
    ): Readonly<T & U>;
    omit<T>(predicate: (keyof T)[], obj: T): Readonly<T>;
    constant<T>(update: T): T;
  }
  const u: Updeep;
  export default u;
}
