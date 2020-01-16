import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { VariableDescriptor, Player } from '../../selectors';
import { proxyfy } from '..';
import { isStillAnswerabled } from './QuestionDescriptor';
import { getChoiceReplies } from '../instancesHelpers';

export function setCurrentResult(_cd: IChoiceDescriptor) {
  return (_self: IPlayer, _resultName: string) => {
    throw Error('This is readonly');
  };
}

export function hasBeenSelected(cd: IChoiceDescriptor) {
  return (self: IPlayer) => {
    const ci = rawGetInstance(cd, self);
    if (ci) {
      for (const r of getChoiceReplies(ci, true)) {
        if (!r.ignored) {
          return true;
        }
      }
    }
    return false;
  };
}

export function hasNotBeenSelected(cd: IChoiceDescriptor) {
  return (self: IPlayer) => !hasBeenSelected(cd)(self);
}

export function hasBeenIgnored(cd: IChoiceDescriptor) {
  return (self: IPlayer) => {
    if (!hasBeenSelected(cd)) {
      const ci = rawGetInstance(cd, self);
      if (ci) {
        const qd = proxyfy(
          VariableDescriptor.select<IQuestionDescriptor>(ci.parentId),
        );
        if (qd) {
          const qi = rawGetInstance(qd, self);
          if (qi) {
            if (qi.validated || !isStillAnswerabled(qd)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
}

export function activate(_cd: IChoiceDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function hasResultBeenApplied(cd: IChoiceDescriptor) {
  return (self: IPlayer, resultName: string) => {
    const ci = rawGetInstance(cd, self);
    if (ci) {
      const replies = getChoiceReplies(ci);
      for (const r of replies) {
        if (r.resultName === resultName) {
          return true;
        }
      }
    }
    return false;
  };
}

export function isActive(cd: IChoiceDescriptor) {
  return (self: IPlayer) => {
    const ci = rawGetInstance(cd, self);
    if (ci) {
      return ci.active;
    }
  };
}

export function deactivate(_cd: IChoiceDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

// Unmapped methods

export function isSelected(cd: IChoiceDescriptor) {
  return (self?: IPlayer) => {
    const p = self != null ? self : Player.selectCurrent();
    const ci = rawGetInstance(cd, p);
    if (ci) {
      return ci.replies.find(r => r.choiceName === cd.name) != null;
    }
    return false;
  };
}

export function getReply(cd: IChoiceDescriptor) {
  return (self?: IPlayer) => {
    const p = self != null ? self : Player.selectCurrent();
    const ci = rawGetInstance(cd, p);
    if (ci) {
      return ci.replies.find(r => r.choiceName === cd.name);
    }
    return false;
  };
}
