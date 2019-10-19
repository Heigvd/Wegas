// import {isEmpty, isTokenMarkedAsRead, sendMessage, } from '../../proxyfy/InboxDescriptor';
// import {getInstance, } from '../../proxyfy/VariableDescriptor';

// class InboxDescriptorMethod {
//   public isEmpty(p: IPlayer, ) : Readonly<boolean> {
//     return isEmpty({} as any)(p,) as Readonly<boolean>;
//   }
//   public isTokenMarkedAsRead(self: IPlayer, token: string, ) : Readonly<boolean> {
//     return isTokenMarkedAsRead({} as any)(self,token,) as Readonly<boolean>;
//   }
//   public sendMessage(p: IPlayer, from: ITranslatableContent, date: ITranslatableContent, subject: ITranslatableContent, body: ITranslatableContent, token: string, attachments: IAttachment[], ) : Readonly<IMessage> {
//     return sendMessage({} as any)(p,from,date,subject,body,token,attachments,) as Readonly<IMessage>;
//   }
//   public getInstance(player: IPlayer, ) : Readonly<IInboxInstance> {
//     return getInstance({} as any)(player,) as Readonly<IInboxInstance>;
//   }
// }

// export type ScriptableInboxDescriptor = InboxDescriptorMethod & IInboxDescriptor;

import { getInstance as rawGetInstance } from '../methods/VariableDescriptorMethods';

export function isEmpty(id: IInboxDescriptor) {
  return (self: IPlayer) => {
    const i = rawGetInstance(id, self);
    if (i) {
      return i.messages.length === 0;
    }
  };
}

export function isTokenMarkedAsRead(id: IInboxDescriptor) {
  return (self: IPlayer, token: string) => {
    const i = rawGetInstance(id, self);
    if (i) {
      return i.messages.filter(m => m.token === token && !m.unread).length > 0;
    }
  };
}

export function sendMessage(_id: IBooleanDescriptor) {
  return (
    _self: IPlayer,
    _from: ITranslatableContent,
    _date: ITranslatableContent,
    _subject: ITranslatableContent,
    _body: ITranslatableContent,
    _token: string,
    _attachments: IAttachment[],
  ) => {
    throw Error('This is readonly');
  };
}
