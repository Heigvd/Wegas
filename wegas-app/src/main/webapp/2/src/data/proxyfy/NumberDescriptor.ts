import { getInstance as vdGetInstance }  from '../methods/VariableDescriptor';


export function getInstance(nd: INumberDescriptor) {
  return (self: IPlayer) => {
    return vdGetInstance(nd, self);
  };
}

export function getValue(nd: INumberDescriptor) {
  return (self: IPlayer) => {
    const i = vdGetInstance(nd, self);
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
