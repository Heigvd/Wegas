// public setCurrentResult(player: IPlayer, resultName: string, ){
//   return setCurrentResult({} as any)(player,resultName,);
// }
// public hasBeenSelected(p: IPlayer, ){
//   return hasBeenSelected({} as any)(p,);
// }
// public hasNotBeenSelected(p: IPlayer, ){
//   return hasNotBeenSelected({} as any)(p,);
// }
// public hasBeenIgnored(p: IPlayer, ){
//   return hasBeenIgnored({} as any)(p,);
// }
// public activate(p: IPlayer, ){
//   return activate({} as any)(p,);
// }
// public getInstance(player: IPlayer, ){
//   return getInstance({} as any)(player,);
// }
// public hasResultBeenApplied(p: IPlayer, resultName: string, ){
//   return hasResultBeenApplied({} as any)(p,resultName,);
// }
// public isActive(p: IPlayer, ){
//   return isActive({} as any)(p,);
// }
// public deactivate(p: IPlayer, ){
//   return deactivate({} as any)(p,);
// }

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { VariableDescriptor } from '../selectors';
import { proxyfy } from '.';
import { isStillAnswerabled } from './QuestionDescriptor';

// INSTANCE METHODS HELPERS (should be moved somewhere else, like I...Instance.ts ???)
export function getReplies(ci: IChoiceInstance, validated?: boolean) {
  if (validated) {
    return ci.replies.filter(r => r.validated);
  } else {
    return ci.replies;
  }
}
//////////////////////////////////////////////////////////////////////////////////////

export function setCurrentResult(_cd: IChoiceDescriptor) {
  return (_self: IPlayer, _resultName: string) => {
    throw Error('This is readonly');
  };
}

export function hasBeenSelected(cd: IChoiceDescriptor) {
  return (self: IPlayer) => {
    const ci = rawGetInstance(cd, self);
    if (ci) {
      for (const r of getReplies(ci, true)) {
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
      const replies = getReplies(ci);
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
