import { store } from '../store';

/**
 * Find a variableDescriptor for an id
 *
 * @export
 * @param {number} [id]  variableDescriptor id
 * @returns {(Readonly<IVariableDescriptor> | undefined)}
 */
export function select(id?: number): Readonly<IVariableDescriptor> | undefined;
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
