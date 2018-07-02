import { store } from '../store';
import { isMatch } from 'lodash-es';

/**
 * Find a variableDescriptor for an id
 *
 * @export
 * @param {number} [id]  variableDescriptor id
 * @returns {(Readonly<IVariableDescriptor> | undefined)}
 */
export function select<T extends IVariableDescriptor = IVariableDescriptor>(
  id?: number,
): Readonly<T> | undefined;
/**
 * Find a list of variableDescriptor for a list of ids
 *
 * @export
 * @param {number[]} id Array of variableDescriptor ids
 * @returns {((Readonly<IVariableDescriptor> | undefined)[])}
 */
export function select(
  id: number[],
): (Readonly<IVariableDescriptor> | undefined)[];
export function select(id: number | number[] | undefined) {
  if (id == null) {
    return;
  }
  const state = store.getState();
  if (Array.isArray(id)) {
    return id.map(i => state.variableDescriptors[i]);
  }
  return state.variableDescriptors[id];
}
/**
 * Select first matching VariableDescriptor
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function first<T extends IVariableDescriptor>(key: keyof T, value: any) {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}
/**
 * Select first matching VariableDescriptor
 * @param o the shape the VariableDescriptor should match
 */
export function firstMatch<T extends IVariableDescriptor>(o: Partial<T>) {
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
export function all<T extends IVariableDescriptor>(key: keyof T, value: any) {
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
