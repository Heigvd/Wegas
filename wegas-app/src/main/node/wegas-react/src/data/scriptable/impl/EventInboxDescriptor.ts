import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import {
  SEventInboxDescriptor,
  SPlayer,
  SEventInboxInstance,
} from 'wegas-ts-api';

export class SEventInboxDescriptorImpl extends SEventInboxDescriptor {

  public isEmpty(p: Readonly<SPlayer>): boolean {
    const events = this.getInstance(p).getEvents();
    return !events || events.length === 0;
  }

  public sendEvent(
    _p: Readonly<SPlayer>,
    _payload: Readonly<string>
  ): Readonly<import('wegas-ts-api').SEvent> {
    throw Error('This is readonly');
  }
  
  public getInstance(player: Readonly<SPlayer>): Readonly<SEventInboxInstance> {
    return getScriptableInstance<SEventInboxInstance>(this, player);
  }
}
