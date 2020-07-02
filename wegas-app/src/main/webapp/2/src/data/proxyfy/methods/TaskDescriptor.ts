import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { ITaskDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';

export function setInstanceProperty(_td: ITaskDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function activate(_td: ITaskDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function getActive(td: ITaskDescriptor) {
  return (self: IPlayer) => {
    const ti = rawGetInstance(td, self);
    if (ti) {
      return ti.active;
    }
  };
}

export function addNumberAtInstanceProperty(_td: ITaskDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function getNumberInstanceProperty(td: ITaskDescriptor) {
  return (self: IPlayer, key: string) => {
    const ti = rawGetInstance(td, self);
    if (ti) {
      return Number(ti.properties[key]);
    }
  };
}

export function getStringInstanceProperty(td: ITaskDescriptor) {
  return (self: IPlayer, key: string) => {
    const ti = rawGetInstance(td, self);
    if (ti) {
      return ti.properties[key];
    }
  };
}

export function deactivate(_td: ITaskDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}
