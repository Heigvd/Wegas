import { shallowIs } from './connectStore';

(test as any).each([
  [true, 1, 1],
  [true, 'hello', 'hello'],
  [true, NaN, NaN],
  [true, { a: 1 }, { a: 1 }],
  [true, [1, 2], [1, 2]],
  [false, { a: undefined }, { b: undefined }],
  [false, { a: 1 }, { a: 2 }],
  [false, { a: [] }, { a: [] }],
  [false, 1, 2],
  [false, '1', 1],
])('Should be %s when shallow comparing %o and %o', (expected, a, b) => {
  expect(shallowIs(a, b)).toBe(expected);
});
