import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SBurndownDescriptor, SBurndownInstance, SPlayer } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SBurndownDescriptorImpl extends SBurndownDescriptor {

  public getInstance(player: Readonly<SPlayer>): Readonly<SBurndownInstance> {
    return getScriptableInstance<SBurndownInstance>(this, player);
  }
}