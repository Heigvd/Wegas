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

export function areSelectedValues(sd: IStringDescriptor) {
  return (self: IPlayer, expectedValues: string[], strictOrder: boolean) => {
    const values = parseStringValues(sd, self);
    if (values.length === expectedValues.length){
      if (strictOrder){
        for (let i = 0; i < values.length;i++){
          if (values[i] !== expectedValues[i]){
            return false;
          }
        }
      } else {
        for (let i = 0; i < values.length;i++){
          if (values[i].indexOf(expectedValues[i]) < 0){
            return false;
          }
        }
      }

      return true;
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
  return (self: IPlayer) =>
    parseStringValues(sd, self).length;
}

export function getPositionOfValue(sd: IStringDescriptor) {
  return (self: IPlayer, value:string) => {
    const pos = parseStringValues(sd, self).indexOf(value);
    if (pos >= 0){
      return pos+1;
    }
    return undefined;
  }
}
