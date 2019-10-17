import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { proxyfy } from '.';
import { TranslatableContent } from '../i18n';

export function getInstance<I extends IVariableInstance>(
  vd: IVariableDescriptor<I>,
) {
  return (self?: IPlayer) => proxyfy(rawGetInstance<I>(vd, self));
}
export function label(vd: IVariableDescriptor) {
  return TranslatableContent.toString(vd.label);
}
export function defaultInstance<I extends IVariableInstance>(
  vd: IVariableDescriptor<I>,
) {
  return proxyfy(vd.defaultInstance);
}