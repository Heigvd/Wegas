import { store } from '../store';

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

export function find<T extends IVariableDescriptor>(key: keyof T, value: any) {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}
