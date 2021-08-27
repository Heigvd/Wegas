import { store } from '../Stores/store';
import { isMatch } from 'lodash-es';
import { IVariableInstance } from 'wegas-ts-api';

/**
 * Find a variableInstance for an id
 *
 * @export
 * @param {number} id variableInstance id
 * @returns {(Readonly<IVariableInstance> | undefined)}
 */
export function select<T extends IVariableInstance = IVariableInstance>(
  id?: number,
): Readonly<T> | undefined;
/**
 * Find a list of variableInstance for a list of ids
 *
 * @export
 * @param {number[]} id Array of variableInstance ids
 * @returns {((Readonly<IVariableInstance> | undefined)[])}
 */
export function select<T extends IVariableInstance = IVariableInstance>(
  id: number[],
): (Readonly<T> | undefined)[];
export function select<T extends IVariableInstance = IVariableInstance>(
  id: number | number[] | undefined,
) {
  if (id == null) {
    return;
  }
  const state = store.getState();
  if (Array.isArray(id)) {
    return id.map(i => state.variableInstances[i] as T);
  }
  return state.variableInstances[id] as T;
}

/**
 * Select first matching VariableInstance
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function first<T extends IVariableInstance>(key: keyof T, value: any) {
  const state = store.getState();
  for (const vi in state.variableInstances) {
    const s = state.variableInstances[vi] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}
/**
 * Select first matching VariableInstance
 * @param o the shape the VariableInstance should match
 */
export function firstMatch<T extends IVariableInstance>(o: Partial<T>) {
  const state = store.getState();
  for (const vi in state.variableInstances) {
    const s = state.variableInstances[vi] as T;
    if (isMatch(s, o)) {
      return s;
    }
  }
}
/**
 * Select all matching VariableInstance
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function all<T extends IVariableInstance>(key: keyof T, value: any) {
  const ret = [];
  const state = store.getState();
  for (const vi in state.variableInstances) {
    const s = state.variableInstances[vi] as T;
    if (s && s[key] === value) {
      ret.push(s);
    }
  }
  return ret;
}
