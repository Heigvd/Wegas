import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { STaskDescriptor, SPlayer, STaskInstance } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class STaskDescriptorImpl extends STaskDescriptor {
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public setInstanceProperty(_p: Readonly<SPlayer>, _key: string, _value: string): void {
    throw Error('This is readonly');
  }
  public getActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public addNumberAtInstanceProperty(_p: Readonly<SPlayer>, _key: string, _value: string): void {
    throw Error('This is readonly');
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<STaskInstance> {
    return getScriptableInstance<STaskInstance>(this, player);
  }
  public getNumberInstanceProperty(p: Readonly<SPlayer>, key: string): number {
    return Number(this.getStringInstanceProperty(p, key));
  }
  public getStringInstanceProperty(p: Readonly<SPlayer>, key: string): string {
    return this.getInstance(p).getProperties()[key];
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
}