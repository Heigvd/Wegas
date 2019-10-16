import { store } from '../store';
import { isMatch } from 'lodash-es';
import { varIsList } from '../entities';

/**
 * Find a variableDescriptor for an id
 *
 * @export
 * @param {number} id variableDescriptor id
 * @returns {(Readonly<IVariableDescriptor> | undefined)}
 */
export function select<T extends IVariableDescriptor = IVariableDescriptor>(
  id?: number | null,
): Readonly<T> | undefined;
/**
 * Find a list of variableDescriptor for a list of ids
 *
 * @export
 * @param {number[]} id Array of variableDescriptor ids
 * @returns {((Readonly<IVariableDescriptor> | undefined)[])}
 */
export function select<T extends IVariableDescriptor = IVariableDescriptor>(
  id: number[],
): (Readonly<T> | undefined)[];
export function select<T extends IVariableDescriptor = IVariableDescriptor>(
  id?: number | number[] | null,
) {
  if (id == null) {
    return;
  }
  const state = store.getState();
  if (Array.isArray(id)) {
    return id.map(i => state.variableDescriptors[i] as T);
  }
  return state.variableDescriptors[id] as T;
}
/**
 * Select first matching VariableDescriptor
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function first<T extends IVariableDescriptor>(
  key: keyof T,
  value: unknown,
): Readonly<T> | undefined {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}
/**
 * Cache for findByName
 */
const descriptorNameIdCache = new Map<string, number>();
/**
 * Find a VariableDescriptor by it's name.
 * They are cached by their id for faster subsequent calls.
 * @param name descriptor's name
 */
export function findByName<T extends IVariableDescriptor>(name: string) {
  const id = descriptorNameIdCache.get(name);
  if (typeof id === 'number') {
    const descriptor = select<T>(id);
    // Check if descriptor still exists and has the right name.
    if (descriptor != null && descriptor.name === name) {
      return descriptor;
    }
    descriptorNameIdCache.delete(name);
  }
  const descriptor = first<T>('name', name);
  if (descriptor != null && descriptor.id != null) {
    descriptorNameIdCache.set(name, descriptor.id!);
  }
  return descriptor;
}
/**
 * Select first matching VariableDescriptor
 * @param o the shape the VariableDescriptor should match
 */
export function firstMatch<T extends IVariableDescriptor>(
  o: Partial<T>,
): Readonly<T> | undefined {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (isMatch(s, o)) {
      return s;
    }
  }
}
/**
 * Select all matching VariableDescriptor
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function all<T extends IVariableDescriptor>(
  key: keyof T,
  value: unknown,
) {
  const ret = [];
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      ret.push(s);
    }
  }
  return ret;
}
/**
 * Extract nested VariableDescriptors from a given ParentDescriptor
 */
export function flatten<
  T extends IVariableDescriptor,
  E extends T['@class'][] = T['@class'][]
>(ld: IParentDescriptor | undefined, ...cls: E) {
  if (ld === undefined) {
    return [];
  }
  const ret: T[] = [];
  const state = store.getState();
  ld.itemsIds.forEach(id => {
    const descriptor = state.variableDescriptors[id];
    if (cls.length > 0) {
      if (descriptor !== undefined && cls.includes(descriptor['@class'])) {
        ret.push(descriptor as T);
      }
    } else if (descriptor !== undefined) {
      ret.push(descriptor as T);
    }

    if (varIsList(descriptor)) {
      ret.push(...flatten<T, E>(descriptor, ...cls));
    }
  });
  return ret;
}
