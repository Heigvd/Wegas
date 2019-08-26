import { getInstance } from '../methods/VariableDescriptor';

export function getValue(nd: INumberDescriptor) {
  return (self: IPlayer) => {
    const i = getInstance(nd, self);
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