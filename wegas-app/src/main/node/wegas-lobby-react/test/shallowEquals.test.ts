import { customStateEquals, shallowEqual } from '../src/store/hooks';
import {test, expect} from "@jest/globals"
const empty: never[] = [];
const array: number[] = [1, 2, 3, 4];
const array2: number[] = [1, 2, 3, 4];

test.each([
  [true, 1, 1],
  [true, 'hello', 'hello'],
  [true, NaN, NaN],
  [true, { a: 1 }, { a: 1 }],
  [true, [1, 2], [1, 2]],
  [true, null, null],
  [true, undefined, undefined],
  [true, { a: empty }, { a: empty }],
  [true, { a: NaN }, { a: NaN }],
  [true, { 0: 'a' }, ['a']],
  [false, { a: undefined }, { b: undefined }],
  [false, { b: undefined, a: undefined }, { b: undefined }],
  [false, [], [1]],
  [false, [1, 2], [2, 3]],
  [false, undefined, null],
  [false, { a: undefined }, {}],
  [false, { a: 1 }, { a: 2 }],
  [true, { a: [] }, { a: [] }],
  [false, 1, 2],
  [false, '1', 1],
  [false, -0, 0], // Object.is
  [false, null, {}],
  [false, {}, null],
  [true, array, array],
  [true, array, array2],
  [true, { a: array }, { a: array }],
  [true, { a: array }, { a: array2 }],
])(
  'Should be %s when customshallow comparing %o and %o',
  (expected: boolean, a: unknown, b: unknown) => {
    expect(customStateEquals(a, b)).toBe(expected);
  },
);

test.each([
  [true, 1, 1],
  [true, 'hello', 'hello'],
  [true, NaN, NaN],
  [true, { a: 1 }, { a: 1 }],
  [true, [1, 2], [1, 2]],
  [true, null, null],
  [true, undefined, undefined],
  [true, { a: empty }, { a: empty }],
  [true, { a: NaN }, { a: NaN }],
  [true, { 0: 'a' }, ['a']],
  [false, { a: undefined }, { b: undefined }],
  [false, { b: undefined, a: undefined }, { b: undefined }],
  [false, [], [1]],
  [false, [1, 2], [2, 3]],
  [false, undefined, null],
  [false, { a: undefined }, {}],
  [false, { a: 1 }, { a: 2 }],
  [false, { a: [] }, { a: [] }],
  [false, 1, 2],
  [false, '1', 1],
  [false, -0, 0], // Object.is
  [false, null, {}],
  [false, {}, null],
  [true, array, array],
  [true, array, array2],
  [true, { a: array }, { a: array }],
  [false, { a: array }, { a: array2 }],
])('Should be %s when shallow comparing %o and %o', (expected: boolean, a: unknown, b: unknown) => {
  expect(shallowEqual(a, b)).toBe(expected);
});
