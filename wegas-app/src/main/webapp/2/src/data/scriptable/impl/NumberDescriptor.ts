import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SNumberDescriptor, SPlayer, SNumberInstance } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SNumberDescriptorImpl extends SNumberDescriptor {
  public add(_p: SPlayer, _value: number): void {
    throw Error('This is readonly');
  }
  public getValue(p: SPlayer): number {
    return this.getInstance(p).getValue();
  }
  public getInstance(player: SPlayer): Readonly<SNumberInstance> {
    return getScriptableInstance<SNumberInstance>(this, player);
  }
  public setValue(_p: SPlayer, _value: number): void {
    throw Error('This is readonly');
  }
}