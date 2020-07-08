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

type ExtractTuppleArray<
  // T extends [any, any, ...any[]][],
  T extends readonly [A1, A2, ...Arest[]][],
  A1,
  A2,
  Arest = [...any[]],
  N extends number = 1
> = {
  [key in keyof T]: T[key] extends [A1, A2, ...Arest[]] ? T[key][N] : unknown;
};

type Test = (
  ...args: ExtractTuppleArray<
    [['bla', 'bla1'], ['bli', 'number']],
    string,
    string
  >
) => void;
