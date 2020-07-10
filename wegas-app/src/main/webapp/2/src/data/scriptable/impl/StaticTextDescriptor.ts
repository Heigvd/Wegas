import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SStaticTextDescriptor, SStaticTextInstance, SPlayer } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SStaticTextDescriptorImpl extends SStaticTextDescriptor {

  public getInstance(player: Readonly<SPlayer>): Readonly<SStaticTextInstance> {
    return getScriptableInstance<SStaticTextInstance>(this, player);
  }
}