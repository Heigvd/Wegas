import { store } from '../store';
import { isMatch } from 'lodash-es';

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
