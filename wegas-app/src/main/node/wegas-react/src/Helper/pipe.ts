/**
 * Compose single argument functions as a pipe (from left to right)
 * @param fns functions to compose as a pipe.
 * @returns function obtained from composing fns
 */
// export function pipe<R>(): (arg: R) => R;
export function pipe<A, R>(fn: (a: A) => R): (a: A) => R;
export function pipe<A, B, R>(fn: (a: A) => B, fn2: (b: B) => R): (a: A) => R;
export function pipe<A, B, C, R>(
  fn: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => R,
): (a: A) => R;
export function pipe<A, B, C, D, R>(
  fn: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => R,
): (a: A) => R;
export function pipe<A, B, C, D, E, R>(
  fn: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => R,
): (a: A) => R;
export function pipe<A, B, C, D, E, F, R>(
  fn: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (e: F) => R,
): (a: A) => R;
export function pipe<A>(...fns: ((a: A) => A)[]):(a:A)=>A
// Could add some more... default to same type going through
export function pipe<A>(...fns: ((a: A) => A)[]) {
  return (arg: A) => fns.reduce((p, f) => f(p), arg);
}
