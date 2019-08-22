import { proxyfy } from '.';
import { VariableDescriptor } from '../selectors';

export function itemsIds(_vd: IParentDescriptor) {
  return undefined;
}
export function items(vd: IParentDescriptor) {
  return vd.itemsIds.map(id => proxyfy(VariableDescriptor.select(id)));
}
