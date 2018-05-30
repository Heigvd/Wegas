import { deepRemove, deepUpdate } from './updateUtils';

test('deepRemove object immutable', () => {
  const obj = { a: { b: 3 }, c: 2 };
  const result = deepRemove(obj, ['a', 'b']);

  expect(obj).toEqual({ a: { b: 3 }, c: 2 });
  expect(result).toEqual({ a: {}, c: 2 });

  const obj2 = { a: 1, b: 2 };
  expect(deepRemove(obj2, ['a'])).toEqual({ b: 2 });
});
test('deepRemove array immutable', () => {
  const arr = [{ a: 1 }];
  const result = deepRemove(arr, ['0', 'a']);
  expect(result).toEqual([{}]);

  const arr2 = { a: ['1'] };
  const result2 = deepRemove(arr2, ['a', '0']);
  expect(result2).toEqual({ a: [] });
});
test('deepRemove nothing', () => {
  expect(deepRemove(undefined, ['1', '2'])).toEqual(undefined);
});
test('deepRemove root', () => {
  const obj = { a: 1 };
  expect(deepRemove(obj, [])).toBe(undefined);
});
test('deepUpdate object immutable', () => {
  const obj = { a: { b: 3 }, c: 2 };
  const result = deepUpdate(obj, ['a', 'b'], 1);

  expect(obj).toEqual({ a: { b: 3 }, c: 2 });
  expect(result).toEqual({ a: { b: 1 }, c: 2 });
});

test('deepUpdate nothing', () => {
  const v = {};
  expect(deepUpdate(undefined, undefined, v)).toBe(v);
});
