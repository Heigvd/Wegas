import { getInstance as rawGetInstance } from '../../methods/VariableDescriptorMethods';

export function isEmpty(id: IInboxDescriptor) {
  return (self: IPlayer) => {
    const ii = rawGetInstance(id, self);
    if (ii) {
      return ii.messages.length === 0;
    }
  };
}

export function isTokenMarkedAsRead(id: IInboxDescriptor) {
  return (self: IPlayer, token: string) => {
    const ii = rawGetInstance(id, self);
    if (ii) {
      return ii.messages.filter(m => m.token === token && !m.unread).length > 0;
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
