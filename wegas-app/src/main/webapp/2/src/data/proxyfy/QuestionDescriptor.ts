// import {isReplied, isNotReplied, isStillAnswerabled, setValidated, activate, isActive, getValidated, deactivate, } from '../../proxyfy/QuestionDescriptor';
// import {getInstance, } from '../../proxyfy/VariableDescriptor';

// class QuestionDescriptorMethod {
//   public isReplied(p: IPlayer, ) : Readonly<boolean> {
//     return isReplied({} as any)(p,) as Readonly<boolean>;
//   }
//   public isNotReplied(p: IPlayer, ) : Readonly<boolean> {
//     return isNotReplied({} as any)(p,) as Readonly<boolean>;
//   }
//   public isStillAnswerabled(p: IPlayer, ) : Readonly<boolean> {
//     return isStillAnswerabled({} as any)(p,) as Readonly<boolean>;
//   }
//   public setValidated(p: IPlayer, value: boolean, ) : Readonly<void> {
//     return setValidated({} as any)(p,value,) as Readonly<void>;
//   }
//   public activate(p: IPlayer, ) : Readonly<void> {
//     return activate({} as any)(p,) as Readonly<void>;
//   }
//   public getInstance(player: IPlayer, ) : Readonly<IQuestionInstance> {
//     return getInstance({} as any)(player,) as Readonly<IQuestionInstance>;
//   }
//   public isActive(p: IPlayer, ) : Readonly<boolean> {
//     return isActive({} as any)(p,) as Readonly<boolean>;
//   }
//   public getValidated(p: IPlayer, ) : Readonly<boolean> {
//     return getValidated({} as any)(p,) as Readonly<boolean>;
//   }
//   public deactivate(p: IPlayer, ) : Readonly<void> {
//     return deactivate({} as any)(p,) as Readonly<void>;
//   }
// }

// export type ScriptableQuestionDescriptor = QuestionDescriptorMethod & IQuestionDescriptor;

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

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
    const i = rawGetInstance(qd, self);
    if (i) {
      return i.active;
    }
  };
}

export function getValidated(qd: IQuestionDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(qd, self);
    if (i) {
      return i.validated;
    }
  };
}

export function deactivate(_qd: IQuestionDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}
