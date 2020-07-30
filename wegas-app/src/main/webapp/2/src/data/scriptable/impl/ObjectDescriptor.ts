import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SObjectDescriptor, SObjectInstance, SPlayer } from 'wegas-ts-api';

export class SObjectDescriptorImpl extends SObjectDescriptor {
  public getProperty(p: Readonly<SPlayer>, key: string): string {
    return this.getInstance(p).getProperties()[key];
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<SObjectInstance> {
    return getScriptableInstance<SObjectInstance>(this, player);
  }
  public size(p: Readonly<SPlayer>): number {
    return Object.keys(this.getInstance(p).getProperties()).length;
  }
  public setProperty(_p: Readonly<SPlayer>, _key: string, _value: string): void {
    throw Error('This is readonly');
  }

}