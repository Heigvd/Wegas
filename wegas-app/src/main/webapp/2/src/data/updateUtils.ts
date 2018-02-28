import { omit, get } from 'lodash-es';
import iassign from 'immutable-assign';
/**
 * Update object with value at given path. returns a newly created object.
 * Immutable.
 *
 * @param entity Object to update
 * @param path path to update
 * @param value value to set at path
 */
export function deepUpdate(
  entity: any = {},
  path: string[] = [],
  value: any,
): any {
  if (path.length > 0) {
    return iassign(entity, e => get(e, path), () => value);
  }
  return value;
}

/**
 * Remove given path in object (delete index in arrays).
 * Immutable.
 *
 * @param object
 * @param path
 */
export function deepRemove(object: any = {}, path: string[]): any {
  if (path.length === 0) {
    return undefined;
  }
  const parentPath = path.slice(0, -1);
  let parent;
  if (parentPath.length === 0) {
    parent = object;
  } else {
    parent = get(object, parentPath);
  }
  if (Array.isArray(parent)) {
    const updatedArray = parent.filter((_v, i) => i !== +path[path.length - 1]);
    return iassign(object, e => get(e, parentPath), () => updatedArray);
  }
  return iassign(
    object,
    o => get(o, parentPath),
    o => omit(o, [path[path.length - 1]]),
  );
}
