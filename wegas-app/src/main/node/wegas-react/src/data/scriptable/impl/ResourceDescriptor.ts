import {
  getInstance as rawGetInstance,
  getScriptableInstance,
} from '../../methods/VariableDescriptorMethods';
import { IResourceDescriptor, IPlayer } from 'wegas-ts-api';
import { SResourceDescriptor, SResourceInstance, SPlayer } from 'wegas-ts-api';

export function addOccupation(_rd: IResourceDescriptor) {
  return (_self: IPlayer, _time: number, _editable: boolean) => {
    throw Error('This is readonly');
  };
}

export function activate(_rd: IResourceDescriptor) {
  return (_self: IPlayer) => {
    throw Error('This is readonly');
  };
}

export function getActive(rd: IResourceDescriptor) {
  return (self: IPlayer) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return ri.active;
    }
  };
}

export function addNumberAtInstanceProperty(_rd: IResourceDescriptor) {
  return (_self: IPlayer, _key: string, _value: string) => {
    throw Error('This is readonly');
  };
}

export function getNumberInstanceProperty(rd: IResourceDescriptor) {
  return (self: IPlayer, key: string) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return Number(ri.properties[key]);
    }
  };
}

export function getStringInstanceProperty(rd: IResourceDescriptor) {
  return (self: IPlayer, key: string) => {
    const ri = rawGetInstance(rd, self);
    if (ri) {
      return ri.properties[key];
    }
  };
}

export function deactivate(_rd: IResourceDescriptor) {
  return (_self: IPlayer) => {};
}

export class SResourceDescriptorImpl extends SResourceDescriptor {
  public addOccupation(
    _p: Readonly<SPlayer>,
    _time: number,
    _editable: boolean,
  ): void {
    throw Error('This is readonly');
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public getActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public addNumberAtInstanceProperty(
    _p: Readonly<SPlayer>,
    _key: string,
    _value: string,
  ): void {
    throw Error('This is readonly');
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<SResourceInstance> {
    return getScriptableInstance<SResourceInstance>(this, player);
  }
  public getNumberInstanceProperty(p: Readonly<SPlayer>, key: string): number {
    return Number(this.getStringInstanceProperty(p, key));
  }
  public getStringInstanceProperty(p: Readonly<SPlayer>, key: string): string {
    return this.getInstance(p).getProperties()[key];
  }
}
