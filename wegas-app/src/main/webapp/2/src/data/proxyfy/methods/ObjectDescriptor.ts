import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { IObjectDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';

export function getProperty(od: IObjectDescriptor) {
  return (self: IPlayer, key: string) => {
    const oi = rawGetInstance(od, self);
    if (oi) {
      return oi.properties[key];
    }
  };
}

export function size(od: IObjectDescriptor) {
  return (self: IPlayer) => Number(getProperty(od)(self, 'size'));
}

export function setProperty(_od: IObjectDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}
