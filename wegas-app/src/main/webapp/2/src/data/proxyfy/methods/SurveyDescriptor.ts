import {
  getInstance as rawGetInstance,
} from '../../methods/VariableDescriptorMethods';

export function isValidated(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.validated;
    }
  };
}

export function isNotValidated(sd: ISurveyDescriptor) {
  return (self: IPlayer) => !isValidated(sd)(self);
}

export function setValidated(_sd: ISurveyDescriptor) {
  return (_self: IPlayer, _value: boolean) => {
    throw Error('This is readonly');
  };
}

export function getValidated(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.validated;
    }
  };
}


export function setActive(_sd: ISurveyDescriptor) {
  return (_self: IPlayer, _value: boolean) => {
    throw Error('This is readonly');
  };
}

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

export function request(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function validate(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function close(_sd: ISurveyDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isStarted(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.started;
    }
  };
}

export function isNotStarted(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return !si.started;
    }
  };
}

export function isClosed(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return si.closed;
    }
  };
}

export function isNotClosed(sd: ISurveyDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return !si.closed;
    }
  };
}
