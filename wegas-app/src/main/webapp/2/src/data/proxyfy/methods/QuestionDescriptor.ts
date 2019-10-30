import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { getQuestionReplies } from '../instancesHelpers';

export function isReplied(qd: IQuestionDescriptor) {
  return (self: IPlayer) => getQuestionReplies(qd, true, self).length > 0;
}

export function isNotReplied(qd: IQuestionDescriptor) {
  return (self: IPlayer) => isReplied(qd)(self);
}

export function isStillAnswerabled(qd: IQuestionDescriptor) {
  return (self: IPlayer) => {
    if (qd.maxReplies != null) {
      const nbReplies = getQuestionReplies(qd, true, self).filter(
        r => !r.ignored,
      ).length;
      if (nbReplies >= qd.maxReplies) {
        return false;
      }
    }
    return true;
  };
}

export function setValidated(_qd: IQuestionDescriptor) {
  return (_self: IPlayer, _value: boolean) => {
    throw Error('This is readonly');
  };
}

export function activate(_qd: IQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function isActive(qd: IQuestionDescriptor) {
  return (self: IPlayer) => {
    const qi = rawGetInstance(qd, self);
    if (qi) {
      return qi.active;
    }
  };
}

export function getValidated(qd: IQuestionDescriptor) {
  return (self: IPlayer) => {
    const qi = rawGetInstance(qd, self);
    if (qi) {
      return qi.validated;
    }
  };
}

export function deactivate(_qd: IQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}
