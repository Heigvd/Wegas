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

// import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
// import { store } from '../store';

// export function isReplied(qd: IQuestionDescriptor) {
//   return (self: IPlayer) => {
//     store.getState().variableDescriptors[qd.parentId]
//     const i = rawGetInstance(qd, self);
//     if (i) {
//       return i.;
//     }
//   };
// }
// export function isFalse(bd: IBooleanDescriptor) {
//   return getValue(bd);
// }
// export function setValue(_bd: IBooleanDescriptor) {
//   return (_self: IPlayer, _value: boolean) => {
//     throw Error('This is readonly');
//   };
// }
