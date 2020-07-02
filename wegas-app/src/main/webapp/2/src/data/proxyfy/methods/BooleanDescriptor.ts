import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { IBooleanDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';

export function getValue(bd: IBooleanDescriptor) {
  return (self: IPlayer) => {
    const bi = rawGetInstance(bd, self);
    if (bi) {
      return bi.value;
    }
  };
}
export function isFalse(bd: IBooleanDescriptor) {
  return getValue(bd);
}
export function setValue(_bd: IBooleanDescriptor) {
  return (_self: IPlayer, _value: boolean) => {
    throw Error('This is readonly');
  };
}
