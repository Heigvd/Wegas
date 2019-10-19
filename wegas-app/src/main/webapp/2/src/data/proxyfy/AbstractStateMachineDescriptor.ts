import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

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
    const i = rawGetInstance(fsmd, self);
    if (i) {
      return i.enabled;
    }
  };
}

export function wentThroughState(fsmd: IFSMDescriptor) {
  return (self: IPlayer, stateKey: number) => {
    const i = rawGetInstance(fsmd, self);
    if (i) {
      return i.transitionHistory.includes(stateKey);
    }
  };
}

export function isDisabled(fsmd: IFSMDescriptor) {
  return !isEnabled(fsmd);
}

export function notWentThroughState(fsmd: IFSMDescriptor) {
  return !wentThroughState(fsmd);
}
