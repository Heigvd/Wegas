import {
  getInstance as rawGetInstance,
} from '../../methods/VariableDescriptorMethods';
import { ISurveyInputDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';


export function activate(_sid: ISurveyInputDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function deactivate(_sid: ISurveyInputDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isActive(sid: ISurveyInputDescriptor) {
  return (self: IPlayer) => {
    const sii = rawGetInstance(sid, self);
    if (sii) {
      return sii.active;
    }
  };
}

export function isNotActive(sid: ISurveyInputDescriptor) {
  return (self: IPlayer) => {
    const sii = rawGetInstance(sid, self);
    if (sii) {
      return !sii.active;
    }
  };
}
