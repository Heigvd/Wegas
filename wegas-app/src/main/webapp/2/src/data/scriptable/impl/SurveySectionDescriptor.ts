import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SSurveySectionDescriptor, SSurveySectionInstance, SPlayer } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SSurveySectionDescriptorImpl extends SSurveySectionDescriptor {
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public isNotActive(p: Readonly<SPlayer>): boolean {
    return !this.isActive(p);
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SSurveySectionInstance> {
    return getScriptableInstance<SSurveySectionInstance>(this, player);
  }
}