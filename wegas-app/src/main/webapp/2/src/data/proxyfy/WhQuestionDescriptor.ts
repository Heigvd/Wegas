import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../i18n';

export function isReplied(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    const wqi = rawGetInstance(wqd, self);
    if (wqi) {
      return wqi.validated;
    }
  };
}

export function isNotReplied(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    return !isReplied(wqd)(self);
  };
}

export function reopen(_wqd: IWhQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function activate(_wqd: IWhQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function getFeedback(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    const wqi = rawGetInstance(wqd, self);
    if (wqi) {
      return TranslatableContent.toString(
        wqi.feedback === undefined ? null : wqi.feedback,
      );
    }
  };
}

export function isActive(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    const wqi = rawGetInstance(wqd, self);
    if (wqi) {
      return wqi.active;
    }
  };
}

export function deactivate(_wqd: IWhQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function setFeedback(_wqd: IWhQuestionDescriptor) {
  return (_self: IPlayer, _value: ITranslatableContent) => {
    throw Error('This is readonly');
  };
}
