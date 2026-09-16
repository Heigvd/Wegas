import * as React from 'react';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { Player, VariableDescriptor } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { useAppSelector } from '../../store/hooks';
import { IVariableDescriptor, IPlayer } from 'wegas-ts-api';
import { instantiate } from '../../data/scriptable';
import { RootState } from '../../store/store';

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
  // Instances live in the new store, so subscribe there: `getInstance` is handed
  // the state it should read from rather than reaching for the store itself.
  const getInstanceForDescriptor = React.useCallback(
    (state: RootState) => {
      if (descriptor) {
        return getInstance(descriptor, player, state) as instanceOf<D>;
      }
      return;
    },
    [descriptor, player],
  );
  const instance = useAppSelector(getInstanceForDescriptor);

  return instantiate(instance);
}
