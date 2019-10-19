import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function getProperty(od: IObjectDescriptor) {
  return (self: IPlayer, key: string) => {
    const i = rawGetInstance(od, self);
    if (i) {
      return i.properties[key];
    }
  };
}

// export function size(od: IObjectDescriptor) {
//   return (self: IPlayer) => {
//     const i = rawGetInstance(od, self);
//     if (i) {
//       return i.;
//     }
//   };
// }

export function setProperty(_od: IObjectDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}
