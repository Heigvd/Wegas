import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../i18n';

export function getValue(td: ITextDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(td, self);
    if (i) {
      return TranslatableContent.toString(
        i.trValue === undefined ? null : i.trValue,
      );
    }
  };
}

export function setValue(_td: ITextDescriptor) {
  return (_self: IPlayer, _value: ITranslatableContent) => {
    throw Error('This is readonly');
  };
}
