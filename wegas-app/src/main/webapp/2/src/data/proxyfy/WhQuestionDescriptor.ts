// import {isReplied, isNotReplied, reopen, activate, getFeedback, isActive, deactivate, setFeedback, } from '../../proxyfy/WhQuestionDescriptor';
// import {getInstance, } from '../../proxyfy/VariableDescriptor';

// class WhQuestionDescriptorMethod {
//   public isReplied(p: IPlayer, ) : Readonly<boolean> {
//     return isReplied({} as any)(p,) as Readonly<boolean>;
//   }
//   public isNotReplied(p: IPlayer, ) : Readonly<boolean> {
//     return isNotReplied({} as any)(p,) as Readonly<boolean>;
//   }
//   public reopen(p: IPlayer, ) : Readonly<void> {
//     return reopen({} as any)(p,) as Readonly<void>;
//   }
//   public activate(p: IPlayer, ) : Readonly<void> {
//     return activate({} as any)(p,) as Readonly<void>;
//   }
//   public getInstance(player: IPlayer, ) : Readonly<IWhQuestionInstance> {
//     return getInstance({} as any)(player,) as Readonly<IWhQuestionInstance>;
//   }
//   public getFeedback(p: IPlayer, ) : Readonly<string> {
//     return getFeedback({} as any)(p,) as Readonly<string>;
//   }
//   public isActive(p: IPlayer, ) : Readonly<boolean> {
//     return isActive({} as any)(p,) as Readonly<boolean>;
//   }
//   public deactivate(p: IPlayer, ) : Readonly<void> {
//     return deactivate({} as any)(p,) as Readonly<void>;
//   }
//   public setFeedback(p: IPlayer, value: ITranslatableContent, ) : Readonly<void> {
//     return setFeedback({} as any)(p,value,) as Readonly<void>;
//   }
// }

// export type ScriptableWhQuestionDescriptor = WhQuestionDescriptorMethod & IWhQuestionDescriptor;

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function isReplied(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(wqd, self);
    if (i) {
      return i.;
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
    const i = rawGetInstance(wqd, self);
    if (i) {
      return i.feedback;
    }
  };
}

export function isActive(wqd: IWhQuestionDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(wqd, self);
    if (i) {
      return i.active;
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