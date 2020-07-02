import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { IFSMDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';

export function disable(_fsmd: IFSMDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function enable(_fsmd: IFSMDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}



export function isEnabled(fsmd: IFSMDescriptor) {
  return (self: IPlayer) => {
    const fsmi = rawGetInstance(fsmd, self);
    if (fsmi) {
      return fsmi.enabled;
    }
  };
}

export function wentThroughState(fsmd: IFSMDescriptor) {
  return (self: IPlayer, stateKey: number) => {
    const fsmi = rawGetInstance(fsmd, self);
    if (fsmi) {
      return fsmi.transitionHistory.includes(stateKey);
    }
  };
}

export function isDisabled(fsmd: IFSMDescriptor) {
  return (self: IPlayer) => {
    return !isEnabled(fsmd)(self);
  };
}

export function notWentThroughState(fsmd: IFSMDescriptor) {
  return (self: IPlayer, stateKey: number) => {
    return !wentThroughState(fsmd)(self, stateKey);
  };
}
