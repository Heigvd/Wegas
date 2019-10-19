// import {setInstanceProperty, activate, getActive, addNumberAtInstanceProperty, getNumberInstanceProperty, getStringInstanceProperty, deactivate, } from '../../proxyfy/TaskDescriptor';
// import {getInstance, } from '../../proxyfy/VariableDescriptor';

// class TaskDescriptorMethod {
//   public setInstanceProperty(p: IPlayer, key: string, value: string, ) : Readonly<void> {
//     return setInstanceProperty({} as any)(p,key,value,) as Readonly<void>;
//   }
//   public activate(p: IPlayer, ) : Readonly<void> {
//     return activate({} as any)(p,) as Readonly<void>;
//   }
//   public getActive(p: IPlayer, ) : Readonly<boolean> {
//     return getActive({} as any)(p,) as Readonly<boolean>;
//   }
//   public getInstance(player: IPlayer, ) : Readonly<ITaskInstance> {
//     return getInstance({} as any)(player,) as Readonly<ITaskInstance>;
//   }
//   public addNumberAtInstanceProperty(p: IPlayer, key: string, value: string, ) : Readonly<void> {
//     return addNumberAtInstanceProperty({} as any)(p,key,value,) as Readonly<void>;
//   }
//   public getNumberInstanceProperty(p: IPlayer, key: string, ) : Readonly<number> {
//     return getNumberInstanceProperty({} as any)(p,key,) as Readonly<number>;
//   }
//   public getStringInstanceProperty(p: IPlayer, key: string, ) : Readonly<string> {
//     return getStringInstanceProperty({} as any)(p,key,) as Readonly<string>;
//   }
//   public deactivate(p: IPlayer, ) : Readonly<void> {
//     return deactivate({} as any)(p,) as Readonly<void>;
//   }
// }

// export type ScriptableTaskDescriptor = TaskDescriptorMethod & ITaskDescriptor;

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function setInstanceProperty(_td: ITaskDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function activate(_td: ITaskDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function getActive(td: ITaskDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(td, self);
    if (i) {
      return i.active;
    }
  };
}

export function addNumberAtInstanceProperty(_td: ITaskDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function getNumberInstanceProperty(td: ITaskDescriptor) {
  return (self: IPlayer, key: string) => {
    const i = rawGetInstance(td, self);
    if (i) {
      return Number(i.properties[key]);
    }
  };
}

export function getStringInstanceProperty(td: ITaskDescriptor) {
  return (self: IPlayer, key: string) => {
    const i = rawGetInstance(td, self);
    if (i) {
      return i.properties[key];
    }
  };
}

export function deactivate(_td: ITaskDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}
