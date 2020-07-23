import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SInboxDescriptor, SPlayer, STranslatableContent, SAttachment, SInboxInstance } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SInboxDescriptorImpl extends SInboxDescriptor {
  public isEmpty(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getMessages().length === 0;
  }

  public sendMessage(_p: Readonly<SPlayer>,
    _from: Readonly<STranslatableContent>,
    _date: Readonly<STranslatableContent>,
    _subject: Readonly<STranslatableContent>,
    _body: Readonly<STranslatableContent>,
    _token: string,
    _attachments: readonly SAttachment[])
    : Readonly<import("wegas-ts-api/src/generated/WegasScriptableEntities").SMessage> {
    throw Error('This is readonly');
  }
  public isTokenMarkedAsRead(self: Readonly<SPlayer>, token: string): boolean {
    return !!this.getInstance(self).getMessages().find(m => !m.getUnread() && m.getToken() === token);
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SInboxInstance> {
    return getScriptableInstance<SInboxInstance>(this, player);
  }
}