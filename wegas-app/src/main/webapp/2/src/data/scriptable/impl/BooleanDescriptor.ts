import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SBooleanDescriptor, SPlayer, SBooleanInstance } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SBooleanDescriptorImpl extends SBooleanDescriptor {
  public getValue(p: SPlayer,): Readonly<boolean> {
    return this.getInstance(p).getValue();
  }

  public isFalse(p: SPlayer,): Readonly<boolean> {
    return !this.getValue(p);
  }

  public getInstance(p: SPlayer,): Readonly<SBooleanInstance> {
    return getScriptableInstance<SBooleanInstance>(this, p);
  }

  public setValue(_p: SPlayer, _v: boolean,): Readonly<void> {
    throw Error('This is readonly');
  }
}
