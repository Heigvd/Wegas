import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../../i18n';
import { parseStringValues } from '../instancesHelpers';

export function getValue(sd: IStringDescriptor) {
  return (self: IPlayer) => {
    const si = rawGetInstance(sd, self);
    if (si) {
      return TranslatableContent.toString(si.trValue);
    }
  };
}

export function isValueSelected(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) => {
    const values = parseStringValues(sd, self);
    for (const v of values) {
      if (v === value) {
        return true;
      }
    }
    return false;
  };
}

export function setValue(_sd: IStringDescriptor) {
  return (_self: IPlayer, _value: ITranslatableContent) => {
    throw Error('This is readonly');
  };
}

export function isNotSelectedValue(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) => !isValueSelected(sd)(self, value);
}

export function countSelectedValues(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) =>
    parseStringValues(sd, self).filter(v => v === value).length;
}
