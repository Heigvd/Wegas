/**
 * Shallow compare 2 values with Object.is
 * @param a first value to compare
 * @param b second value to compare
 */
export function shallowIs(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if ('object' === typeof a && 'object' === typeof b) {
    if (a === null) return false;
    if (b === null) return false;
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return false;
    if (isArrayA) {
      if ((a as any[]).length !== (b as any[]).length) return false;
      if ((a as any[]).some((v, i) => !Object.is((b as any[])[i], v)))
        return false;
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!Object.is(a[k], b[k])) return false;
      if (!keysB.includes(k)) return false;
    }
    return true;
  }
  return false;
}
