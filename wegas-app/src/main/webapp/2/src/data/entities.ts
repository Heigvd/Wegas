/**
 * Check if variable has children
 * @param variable Variable to test
 */
export function varIsList(variable: any): variable is IParentDescriptor {
  return Array.isArray(variable.itemsIds);
}
/**
 * Check entity type.
 * @param variable Variable to test
 * @param cls Discriminant, class
 */
export function entityIs<T extends IWegasEntity>(
  variable: any,
  cls: T['@class'],
): variable is T {
  if ('object' === typeof variable) {
    return variable['@class'] === cls;
  }
  return false;
}
