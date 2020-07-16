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

type WegasEvent = (ExceptionEvent | ClientEvent) & {
  timestamp: number;
  unread: boolean;
};
