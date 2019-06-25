import { shallowIs } from './shallowIs';

const empty: never[] = [];
test.each<[boolean, unknown, unknown]>([
  [true, 1, 1],
  [true, 'hello', 'hello'],
  [true, NaN, NaN],
  [true, { a: 1 }, { a: 1 }],
  [true, [1, 2], [1, 2]],
  [true, null, null],
  [true, undefined, undefined],
  [true, { a: empty }, { a: empty }],
  [true, { a: NaN }, { a: NaN }],
  [false, { a: undefined }, { b: undefined }],
  [false, { b: undefined, a: undefined }, { b: undefined }],
  [false, [], [1]],
  [false, [1, 2], [2, 3]],
  [false, undefined, null],
  [false, { a: undefined }, {}],
  [false, { a: 1 }, { a: 2 }],
  [false, { 0: 'a' }, ['a']],
  [false, { a: [] }, { a: [] }],
  [false, 1, 2],
  [false, '1', 1],
  [false, -0, 0], // Object.is
  [false, null, {}],
  [false, {}, null],
])(
  'Should be %s when shallow comparing %o and %o',
  (expected: boolean, a: unknown, b: unknown) => {
    expect(shallowIs(a, b)).toBe(expected);
  },
);
