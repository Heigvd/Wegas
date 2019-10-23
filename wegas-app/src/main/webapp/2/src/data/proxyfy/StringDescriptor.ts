import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../i18n';

// INSTANCE METHODS HELPERS (should be moved somewhere else, like I...Instance.ts ???)
export function parseValues(sd: IStringDescriptor, self: IPlayer) {
  const json = getValue(sd)(self);
  if (json) {
    try {
      return JSON.parse(json) as string[];
    } catch (_e) {
      return [];
    }
  }
  return [];
}
//////////////////////////////////////////////////////////////////////////////////////

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
    const values = parseValues(sd, self);
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
    parseValues(sd, self).filter(v => v === value).length;
}
