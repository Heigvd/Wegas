import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';

export function setState(_prd: IPeerReviewDescriptor) {
  return (_self: IPlayer, _stateName: string) => {
    throw Error('This is readonly');
  };
}

export function getState(prd: IPeerReviewDescriptor) {
  return (self: IPlayer) => {
    const pri = rawGetInstance(prd, self);
    if (pri) {
      return pri.reviewState;
    }
  };
}
