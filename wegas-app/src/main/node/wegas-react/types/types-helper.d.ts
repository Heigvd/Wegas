/**
 * Make specified key optional. Others don't change.
 */
type PartialKey<Type, Keys extends keyof Type> = Omit<Type, Keys> &
  Partial<Pick<Type, Keys>>;
/**
 * Merge two type into a new one.
 * Keys of the second type overrides the ones of the first type.
 */
type Merge<A, B> = Omit<A, Extract<keyof A, keyof B>> & B;

/**
 * Get the values' type of a given type
 */
type ValueOf<Type> = Type extends readonly unknown[]
  ? Type[number]
  : Type extends object
  ? Type[keyof Type]
  : Type;

interface Testiface {
  a: string;
  b: number;
}

// add an element to the end of a tuple
type Push<L extends any[], T> = ((r: any, ...x: L) => void) extends (
  ...x: infer L2
) => void
  ? { [K in keyof L2]-?: K extends keyof L ? L[K] : T }
  : never;

type ReadonlyTuple<T extends any[]> = {
  readonly [P in Exclude<keyof T, keyof []>]: T[P];
} &
  Iterable<T[number]>;

type ExtractTuppleArray<
  T extends readonly ReadonlyTuple<[A1, A2, ...Arest[]]>[],
  A1,
  A2,
  Arest = [...any[]],
  N extends keyof ReadonlyTuple<[A1, A2, ...Arest[]]> = '1',
  Lookup extends false | UknownValuesObject = false,
  RET = {
    [key in keyof T]: N extends keyof T[key] ? T[key][N] : unknown;
  },
> = ValueOf<RET> extends keyof Lookup
  ? {
      [key in keyof RET]: RET[key] extends keyof Lookup
        ? Lookup[RET[key]]
        : unknown;
    }
  : RET;

type EmptyObject = Record<string, never>;
type UknownValuesObject = Record<string, unknown>;
type AnyValuesObject = Record<string, any>;
