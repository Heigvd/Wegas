interface IWegasConflictException {
  '@class': 'WegasConflictException';
}
interface WegasErrorMessage {
  '@class': 'WegasErrorMessage';
  level: string;
  message: string;
}
interface WegasNotFoundException {
  '@class': 'WegasNotFoundException';
  message: string;
}
interface WegasOutOfBoundException {
  '@class': 'WegasOutOfBoundException';
  min?: number;
  max?: number;
  variableName: string;
  value: number;
}
interface WegasScriptException {
  '@class': 'WegasScriptException';
  message: string;
  lineNumber: number;
  script: string;
}
interface WegasWrappedException {
  '@class': 'WegasWrappedException';
  message: string;
}
type WegasExceptions =
  | IWegasConflictException
  | WegasErrorMessage
  | WegasNotFoundException
  | WegasOutOfBoundException
  | WegasScriptException
  | WegasWrappedException;

interface ExceptionEvent {
  '@class': 'ExceptionEvent';
  exceptions: WegasExceptions[];
}
interface ClientEvent {
  '@class': 'ClientEvent';
  error: string;
}

interface WegasEvents {
  ExceptionEvent: ExceptionEvent;
  ClientEvent: ClientEvent;
}

type WegasEvent = WegasEvents[keyof WegasEvents] & {
  timestamp: number;
  unread: boolean;
};

type WegasEventHandler = (event: WegasEvent) => void;

interface WegasEventHandlers {
  ExceptionEvent: { [handlerId: string]: WegasEventHandler };
  ClientEvent: { [handlerId: string]: WegasEventHandler };
}

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
