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

export function setCurrentResult(_cd: IChoiceDescriptor) {
  return (_self: IPlayer, _resultName: string) => {
    throw Error('This is readonly');
  };
}

// for (Reply r : result.getChoiceDescriptor().getQuestion().getInstance(defaultValues, player).getReplies(player, true)) {
//   if (r.getResult().getChoiceDescriptor().equals(result.getChoiceDescriptor())) {
//       hasBeenSelected = true;
//   }
// }

export function hasBeenSelected(cd: IChoiceDescriptor) {
  return (self: IPlayer) => {
    if(cd.parentId){
    const cdi = rawGetInstance(cd.parentId, self);
    if (cdi) {
      cdi.
      return i.;
    }
  };
}
}
// export function isFalse(bd: IBooleanDescriptor) {
//   return getValue(bd);
// }
// export function isFalse(bd: IBooleanDescriptor) {
//   return getValue(bd);
// }
// export function isFalse(bd: IBooleanDescriptor) {
//   return getValue(bd);
// }
// export function setValue(_bd: IBooleanDescriptor) {
//   return (_self: IPlayer, _value: number) => {
//     throw Error('This is readonly');
//   };
// }
