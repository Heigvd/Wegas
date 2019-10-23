import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function addOccupation(_rd: IResourceDescriptor) {
  return (
    _self: IPlayer,
    _time: number,
    _editable: boolean,
    _description: string,
  ) => {
    throw Error('This is readonly');
  };
}

export function activate(_rd: IResourceDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function getActive(rd: IResourceDescriptor) {
  return (self: IPlayer) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return ri.active;
    }
  };
}

export function addNumberAtInstanceProperty(_rd: IResourceDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function getNumberInstanceProperty(rd: IResourceDescriptor) {
  return (self: IPlayer, key: string) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return Number(ri.properties[key]);
    }
  };
}

export function getStringInstanceProperty(rd: IResourceDescriptor) {
  return (self: IPlayer, key: string) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return ri.properties[key];
    }
  };
}

export function deactivate(_rd: IResourceDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}
