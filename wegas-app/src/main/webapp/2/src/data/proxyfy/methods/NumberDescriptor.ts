import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';

export function getValue(nd: INumberDescriptor) {
  return (self: IPlayer) => {
    const ni = rawGetInstance(nd, self);
    if (ni) {
      return ni.value;
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
