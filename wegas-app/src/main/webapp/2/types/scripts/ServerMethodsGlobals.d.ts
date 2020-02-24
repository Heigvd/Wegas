// Idealy, wenerate it
interface WRequestManager {
  sendCustomEvent: (type: 'popupEvent', payload: { content: string }) => void;
}

interface WEvent {
  fire: (eventName: string) => void;
  fired: (eventName: string) => boolean;
}

interface WDelayedEvent {
  delayedFire: (minutes: number, second: number, eventName: string) => void;
}
///

interface GlobalServerMethod {
  label: string;
  returns?: string;
  parameters: {}[];
}

interface GlobalServerMethods {
  [method: string]: GlobalServerMethod | undefined;
}

interface ServerMethodPayload {
  method: string;
  schema?: GlobalServerMethod;
}

/**
 * Register a server method that can be used in wysywig
 * @param method - the method to add (ex: "Something.Else.call")
 * @param schema - method's schema including : label, return type (optionnal) and the parameter's shemas
 */
type ServerMethodRegister = (
  method: string,
  schema: {
    label: string;
    returns?: string;
    parameters: {}[];
  },
) => void;

interface GlobalServerMethodClass {
  registerMethod: ServerMethodRegister;
}
