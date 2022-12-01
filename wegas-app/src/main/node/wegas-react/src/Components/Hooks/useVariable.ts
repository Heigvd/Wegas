import * as React from 'react';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { Player, VariableDescriptor } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { IVariableDescriptor, IPlayer } from 'wegas-ts-api';
import { instantiate } from '../../data/scriptable';

type instanceOf<D> = D extends IVariableDescriptor<infer U> ? U : never;
/**
 * Hook, connect with a VariableDescriptor
 * @param name VariableDescriptor's name
 */
export function useVariableDescriptor<D extends IVariableDescriptor>(
  name?: string,
) {
  const getDescriptor = React.useCallback(
    () => VariableDescriptor.findByName<D>(name),
    [name],
  );
  return useStore(getDescriptor);
}
/**
 * Hook, connect with a VariableInstance
 * @param descriptor VariableInstance's VariableDescriptor
 * @param player Player owning the instance
 */
export function useVariableInstance<
  D extends IVariableDescriptor | SVariableDescriptor,
>(descriptor?: D, player: IPlayer = Player.selectCurrent()) {
  const getInstanceForDescriptor = React.useCallback(() => {
    if (descriptor) {
      return getInstance(descriptor, player) as instanceOf<D>;
    }
    return;
  }, [descriptor, player]);
  const instance = useStore(getInstanceForDescriptor);

  return instantiate(instance);
}
