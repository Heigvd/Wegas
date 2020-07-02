import {
  getInstance as rawGetInstance,
} from '../../methods/VariableDescriptorMethods';
import { ISurveyDescriptor, IPlayer } from 'wegas-ts-api/typings/WegasEntities';


export function activate(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function deactivate(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isActive(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.active;
    }
  };
}

export function isNotActive(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return !si.active;
    }
  };
}


export function request(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isOngoing(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.status === "ONGOING";
    }
  };
}

export function isNotOngoing(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return !isOngoing(sd)(self);
    }
  };
}


export function complete(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isCompleted(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.status === "COMPLETED";
    }
  };
}

export function isNotCompleted(sd: ISurveyDescriptor) {
  return (self: IPlayer) => !isCompleted(sd)(self);
}



export function close(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}


export function isClosed(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.status === "CLOSED";
    }
  };
}

export function isNotClosed(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return !isClosed(sd)(self);
    }
  };
}
