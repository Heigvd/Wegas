import {
  getInstance as rawGetInstance,
  getInstance,
} from '../../methods/VariableDescriptorMethods';
import { getQuestionReplies } from '../instancesHelpers';
import { VariableDescriptor, Player } from '../../selectors';
import { IQuestionDescriptor, IPlayer, IChoiceDescriptor } from 'wegas-ts-api/typings/WegasEntities';

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

// Unmapped methods

export function getChoices(qd: IQuestionDescriptor) {
  return VariableDescriptor.select<IChoiceDescriptor>(qd.itemsIds).filter(
    c => c != null,
  ) as Readonly<IChoiceDescriptor>[];
}

export function isUnread(qd: IQuestionDescriptor) {
  return (self?: IPlayer) => {
    const p = self != null ? self : Player.selectCurrent();
    return (
      getChoices(qd)
        .map(cd => getInstance(cd, p))
        .filter(ci => ci && ci.unread).length > 0
    );
  };
}
