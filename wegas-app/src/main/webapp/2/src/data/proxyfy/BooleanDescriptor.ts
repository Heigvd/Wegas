import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function getValue(bd: IBooleanDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(bd, self);
    if (i) {
      return i.value;
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
