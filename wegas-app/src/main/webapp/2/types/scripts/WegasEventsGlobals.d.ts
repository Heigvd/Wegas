type IDestroyedEntity = import('wegas-ts-api/typings/WegasEntities').IDestroyedEntity;
type IUser = import('wegas-ts-api/typings/WegasEntities').IUser;

interface RuntimeException {
  message: string;
}
interface WegasAccessDenied extends RuntimeException {
  '@class': 'WegasAccessDenied';
  entity: {};
  mode: string;
  user: IUser;
}

interface WegasConflictException extends RuntimeException {
  '@class': 'WegasConflictException';
}
interface WegasErrorMessage extends RuntimeException {
  '@class': 'WegasErrorMessage';
  level: 'info' | 'warn' | 'error';
  messageId: string;
}
interface WegasIncompatibleType extends RuntimeException {
  '@class': 'WegasIncompatibleType';
}
interface WegasNotFoundException extends RuntimeException {
  '@class': 'WegasNotFoundException';
  message: string;
}
interface WegasOutOfBoundException extends RuntimeException {
  '@class': 'WegasOutOfBoundException';
  min?: number;
  max?: number;
  variableName: string;
  value: number;
  label: string;
}
interface WegasScriptException extends RuntimeException {
  '@class': 'WegasScriptException';
  lineNumber: number;
  script: string;
}
interface WegasWrappedException extends RuntimeException {
  '@class': 'WegasWrappedException';
  message: string;
}
interface WegasUniqueConstraintException extends RuntimeException {
  '@class': 'WegasUniqueConstraintException';
}

type WegasExceptions =
  | WegasAccessDenied
  | WegasConflictException
  | WegasErrorMessage
  | WegasIncompatibleType
  | WegasNotFoundException
  | WegasOutOfBoundException
  | WegasScriptException
  | WegasUniqueConstraintException
  | WegasWrappedException;

interface ExceptionEvent {
  '@class': 'ExceptionEvent';
  exceptions: WegasExceptions[];
}
interface ClientEvent {
  '@class': 'ClientEvent';
  error: string;
}
interface CustomEvent {
  '@class': 'CustomEvent';
  type: string;
  payload: {};
}
interface EntityDestroyedEvent {
  '@class': 'EntityDestroyedEvent';
  destroyedEntities: IDestroyedEntity[];
}
interface EntityUpdatedEvent {
  '@class': 'EntityUpdatedEvent';
  updatedEntites: IAbstractEntity[];
}
interface OutdatedEntitiesEvent {
  '@class': 'OutdatedEntitiesEvent';
  outdated: { type: string; id: number }[];
}

interface WegasEvents {
  ExceptionEvent: ExceptionEvent;
  ClientEvent: ClientEvent;
  CustomEvent: CustomEvent;
  EntityDestroyedEvent: EntityDestroyedEvent;
  EntityUpdatedEvent: EntityUpdatedEvent;
  OutdatedEntitiesEvent: OutdatedEntitiesEvent;
}

type WegasEvent = WegasEvents[keyof WegasEvents] & {
  timestamp: number;
  unread: boolean;
};

type WegasEventHandler = (event: WegasEvent) => void;

type WegasEventHandlers = {
  [key in keyof WegasEvents]: { [handlerId: string]: WegasEventHandler };
};

// interface WegasEventHandlers {
//   ExceptionEvent: { [handlerId: string]: WegasEventHandler };
//   ClientEvent: { [handlerId: string]: WegasEventHandler };
// }

interface WegasEventClass {
  /**
   * addEventHandler - allows to hook on a wegas event.
   * @param handlerId - the unique identifier of the handler (if another handler is given with the same id it will be ignored)
   * @param eventType - the wegas type of event that trigerred the handler
   * @param handler - the function triggered by the event
   */
  addEventHandler: <T extends keyof WegasEvents>(
    handlerId: string,
    eventType: T,
    handler: (
      event: WegasEvents[T] & { timestamp: number; unread: boolean },
    ) => void,
  ) => void;
  /**
   * removeEventHandler - remove a handler.
   * @param handlerId - the unique identifier of the handler (if another handler is given with the same id, the first one will be overriden)
   * @param eventType - the wegas type of event that trigerred the handler
   */
  removeEventHandler: (
    handlerId: string,
    eventType: WegasEvent['@class'],
  ) => void;
}
