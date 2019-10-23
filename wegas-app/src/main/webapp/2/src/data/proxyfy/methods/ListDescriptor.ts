import { proxyfy } from '..';
import { VariableDescriptor } from '../../selectors';

export function itemsIds(_pd: IParentDescriptor) {
  return undefined;
}
export function items(pd: IParentDescriptor) {
  return pd.itemsIds.map(id => proxyfy(VariableDescriptor.select(id)));
}
