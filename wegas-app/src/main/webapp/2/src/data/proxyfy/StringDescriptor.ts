// import {getValue, isValueSelected, setValue, isNotSelectedValue, countSelectedValues, } from '../../proxyfy/StringDescriptor';
// import {getInstance, } from '../../proxyfy/VariableDescriptor';

// class StringDescriptorMethod {
//   public getValue(p: IPlayer, ) : Readonly<string> {
//     return getValue({} as any)(p,) as Readonly<string>;
//   }
//   public isValueSelected(p: IPlayer, value: string, ) : Readonly<boolean> {
//     return isValueSelected({} as any)(p,value,) as Readonly<boolean>;
//   }
//   public setValue(p: IPlayer, value: ITranslatableContent, ) : Readonly<void> {
//     return setValue({} as any)(p,value,) as Readonly<void>;
//   }
//   public getInstance(player: IPlayer, ) : Readonly<IStringInstance> {
//     return getInstance({} as any)(player,) as Readonly<IStringInstance>;
//   }
//   public isNotSelectedValue(p: IPlayer, value: string, ) : Readonly<boolean> {
//     return isNotSelectedValue({} as any)(p,value,) as Readonly<boolean>;
//   }
//   public countSelectedValues(p: IPlayer, value: string, ) : Readonly<number> {
//     return countSelectedValues({} as any)(p,value,) as Readonly<number>;
//   }
// }

// export type ScriptableStringDescriptor = StringDescriptorMethod & IStringDescriptor;

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../i18n';

export function getValue(sd: IStringDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(sd, self);
    if (i) {
      return TranslatableContent.toString(i.trValue);
    }
  };
}

export function isValueSelected(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) => {};
}

export function setValue(_sd: IStringDescriptor) {
  return (_self: IPlayer, _value: ITranslatableContent) => {
    throw Error('This is readonly');
  };
}

export function isNotSelectedValue(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) => {
    return !isValueSelected(sd)(self, value);
  };
}

export function countSelectedValues(sd: IStringDescriptor) {
  return (self: IPlayer, value: string) => {};
}
