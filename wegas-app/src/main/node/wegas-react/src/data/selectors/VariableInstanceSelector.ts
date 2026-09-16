import { isMatch } from 'lodash-es';
import { IVariableInstance } from 'wegas-ts-api';
import { RootState, store } from '../../store/store';

/**
 * All selectors below are dual-use: called without a state they read the store
 * synchronously (imperative callers, user scripts); passed a state they act as
 * plain selectors and can be composed inside useAppSelector.
 */

/**
 * Find a variableInstance for an id
 *
 * @export
 * @param {number} id variableInstance id
 * @returns {(Readonly<IVariableInstance> | undefined)}
 */
export function select<T extends IVariableInstance = IVariableInstance>(
  id?: number,
  state?: RootState,
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
  state?: RootState,
): (Readonly<T> | undefined)[];
export function select<T extends IVariableInstance = IVariableInstance>(
  id: number | number[] | undefined,
  state: RootState = store.getState(),
) {
  if (id == null) {
    return;
  }
  if (Array.isArray(id)) {
    return id.map(i => state.variableInstances.instances[i] as T);
  }
  return state.variableInstances.instances[id] as T;
}

/**
 * Select first matching VariableInstance
 * @param key the key to search for
 * @param value the value the key should be equal
 */
export function first<T extends IVariableInstance>(
  key: keyof T,
  value: ValueOf<T>,
  state: RootState = store.getState(),
) {
  for (const vi in state.variableInstances.instances) {
    const s = state.variableInstances.instances[vi] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}
/**
 * Select first matching VariableInstance
 * @param o the shape the VariableInstance should match
 */
export function firstMatch<T extends IVariableInstance>(
  o: Partial<T>,
  state: RootState = store.getState(),
) {
  for (const vi in state.variableInstances.instances) {
    const s = state.variableInstances.instances[vi] as T;
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
export function all<T extends IVariableInstance>(
  key: keyof T,
  value: ValueOf<T>,
  state: RootState = store.getState(),
) {
  const ret = [];
  for (const vi in state.variableInstances.instances) {
    const s = state.variableInstances.instances[vi] as T;
    if (s && s[key] === value) {
      ret.push(s);
    }
  }
  return ret;
}
