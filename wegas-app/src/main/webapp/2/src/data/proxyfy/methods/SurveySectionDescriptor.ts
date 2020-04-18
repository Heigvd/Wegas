import {
  getInstance as rawGetInstance,
} from '../../methods/VariableDescriptorMethods';


export function activate(_ssd: ISurveySectionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function deactivate(_ssd: ISurveySectionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isActive(ssd: ISurveySectionDescriptor) {
  return (self: IPlayer) => {
    const ssi = rawGetInstance(ssd, self);
    if (ssi) {
      return ssi.active;
    }
  };
}

export function isNotActive(ssd: ISurveySectionDescriptor) {
  return (self: IPlayer) => {
    const ssi = rawGetInstance(ssd, self);
    if (ssi) {
      return !ssi.active;
    }
  };
}
