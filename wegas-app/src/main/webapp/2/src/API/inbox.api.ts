import { rest, managedModeRequest } from './rest';
import { GameModel } from '../data/selectors';
import { IMessage } from 'wegas-ts-api/typings/WegasEntities';

/*
PUT     /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/Message/Read/{messageId : [1-9][0-9]*}/{playerId : [1-9][0-9]*}
DELETE  /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/Message/{messageId : [1-9][0-9]*}
GET     /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/Message/{messageId : [1-9][0-9]*}
PUT     /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/Message/{messageId : [1-9][0-9]*}
PUT     /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/{inboxInstanceId : [1-9][0-9]*}/ReadAll/{playerId : [1-9][0-9]*}
GET     /Wegas/rest/GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/{instanceId : [1-9][0-9]*}/Message
*/

const INBOX_BASE = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined ? GameModel.selectCurrent().id! : gameModelId
  }/VariableDescriptor/Inbox/`;

const MESSAGE_BASE = (gameModelId?: number) =>
  INBOX_BASE(gameModelId) + 'Message/';

// update(variableInstance: IVariableInstance, gameModelId?: number) {
//   return managedModeRequest(
//     `${VI_BASE({ v: variableInstance, gameModelId })}`,
//     { method: 'PUT', body: JSON.stringify(variableInstance) },
//   );
// },

/**
 * InboxAPIFactory - generates en object containing methods to manage inboxes
 * @param gameModelId
 */
export const InboxAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * List all messages from an inbox
     * @param inboxId the id of the inbox
     */
    getMessages(inboxId: number): Promise<IMessage[]> {
      return rest(INBOX_BASE(gameModelId) + inboxId + '/Message').then(
        (res: Response) => {
          return res.json();
        },
      );
    },
    /**
     * List all messages in an inbox with a certain player
     * @param inboxId the id of the inbox
     * @param playerId the id of the player
     */
    readMessages(inboxId: number, playerId: number) {
      return managedModeRequest(
        INBOX_BASE(gameModelId) + inboxId + '/ReadAll/' + playerId,
        {
          method: 'PUT',
        },
      );
    },

    /**
     * Get a message
     * @param messageId the id of the message
     */
    getMessage(messageId: number): Promise<IMessage> {
      return rest(MESSAGE_BASE(gameModelId) + messageId).then(
        (res: Response) => {
          return res.json();
        },
      );
    },
    /**
     * Set a message
     * @param messageId the id of the message
     * @param message the content of the message to set
     */
    setMessage(messageId: number, message: IMessage) {
      return managedModeRequest(MESSAGE_BASE(gameModelId) + messageId, {
        method: 'PUT',
        body: JSON.stringify(message),
      });
    },
    /**
     * Delete a message
     * @param messageId the id of the message
     */
    deleteMessage(messageId: number) {
      return managedModeRequest(MESSAGE_BASE(gameModelId) + messageId, {
        method: 'DELETE',
      });
    },
    /**
     * Set a message as read by a certain player
     * @param messageId the id of the message
     * @param playerId the id of the player
     */
    readMessage(messageId: number, playerId: number) {
      return managedModeRequest(
        MESSAGE_BASE(gameModelId) + 'Read/' + messageId + '/' + playerId,
        {
          method: 'PUT',
        },
      );
    },
  };
};

export const InboxAPI = InboxAPIFactory();
