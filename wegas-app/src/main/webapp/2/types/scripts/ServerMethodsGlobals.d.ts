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

interface GlobalServerMethod {
  '@class': 'GlobalServerMethod';
  label: string;
  returns?: string;
  parameters: {}[];
}

interface GlobalServerMethods {
  [method: string]: GlobalServerMethod | undefined;
}

interface GlobalServerObject {
  [object: string]: GlobalServerObject | GlobalServerMethod | undefined;
}

interface ServerMethodPayload {
  objects: [string, ...string[]];
  method: string;
  schema?: GlobalServerMethod;
}

/**
 * Register a server method that can be used in wysywig
 * @param objects - the objects containing the method (ex: PMGHelper.MailMethods.<method> => ["PMGHelper","MailMethods"])
 * @param method - the method to add
 * @param schema - method's schema including : label, return type (optionnal) and the parameter's shemas
 */
type ServerMethodRegister = (
  objects: [string, ...string[]],
  method: string,
  schema: {
    label: string;
    returns?: string;
    parameters: { type: string, required: boolean }[];
  },
) => void;

interface GlobalServerMethodClass {
  registerMethod: ServerMethodRegister;
}
