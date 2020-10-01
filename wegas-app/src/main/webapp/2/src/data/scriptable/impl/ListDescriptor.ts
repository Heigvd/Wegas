import {
  getItems,
  getScriptableInstance,
} from '../../methods/VariableDescriptorMethods';
import { SListDescriptor, SListInstance, SPlayer } from 'wegas-ts-api';

export class SListDescriptorImpl extends SListDescriptor {
  public getInstance(player: Readonly<SPlayer>): Readonly<SListInstance> {
    return getScriptableInstance<SListInstance>(this, player);
  }
  public getItems() {
    return getItems<SVariableDescriptor>(this.entity.itemsIds);
  }
}
