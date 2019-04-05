/**
 * Shallow compare 2 values with Object.is
 * @param a first value to compare
 * @param b second value to compare
 */
export function shallowIs(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true;
  if ('object' === typeof a && 'object' === typeof b) {
    if (a === null) return false;
    if (b === null) return false;
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return false;
    if (isArrayA) {
      if ((a as unknown[]).length !== (b as unknown[]).length) return false;
      if ((a as unknown[]).some((v, i) => !Object.is((b as any[])[i], v)))
        return false;
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (
        !Object.is(
          (a as { [k: string]: unknown })[k],
          (b as { [k: string]: unknown })[k],
        )
      )
        return false;
      if (!keysB.includes(k)) return false;
    }
    return true;
  }
  return false;
}
