import { pipe } from './pipe';

test('Should handle no function', () => {
  const o = {};
  expect(pipe()(o)).toBe(o);
});
test('Should pipe', () => {
  function f(x: number) {
    return x * 3;
  }
  function g(x: number) {
    return String(x);
  }
  expect(pipe(f)(3)).toBe(f(3));
  expect(pipe(f, f, g)(3)).toBe('27');
});
test('Ordering should count', () => {
  function f(x: number) {
    return x * 3;
  }
  function g(x: number) {
    return x + 1;
  }
  expect(pipe(f, g)(3)).toBe(g(f(3)));
  expect(pipe(f, g)(3)).toBe(10);
  expect(pipe(g, f)(3)).toBe(12);
});

test('Should handle async code', async () => {
  function wait(t: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, t);
    });
  }

  async function add1(x: number) {
    await wait(10);
    return x + 1;
  }
  expect(await pipe(add1)(3)).toBe(3 + 1);
  expect(await pipe(add1, async x => (await x) * (await x))(3)).toBe(
    (3 + 1) ** 2,
  );
});
