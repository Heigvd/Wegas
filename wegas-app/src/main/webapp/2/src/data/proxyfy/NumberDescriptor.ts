import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function getValue(nd: INumberDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(nd, self);
    if (i) {
      return i.value;
    }
  };
}
export function add(_nd: INumberDescriptor) {
  return (_self: IPlayer, _value: number) => {
    throw Error('This is readonly');
  };
}

export function setValue(_nd: INumberDescriptor) {
  return (_self: IPlayer, _value: number) => {
    throw Error('This is readonly');
  };
}
