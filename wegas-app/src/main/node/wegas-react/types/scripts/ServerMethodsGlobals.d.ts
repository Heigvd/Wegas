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

interface ServerGlobalMethod {
  '@class': 'ServerGlobalMethod';
  label: string;
  returns?: string;
  parameters: {}[];
}

interface ServerGlobalObject {
  [object: string]: ServerGlobalObject | ServerGlobalMethod | undefined;
}

interface ServerGlobalMethodPayload {
  objects: [string, ...string[]];
  method: string;
  schema?: ServerGlobalMethod;
}

/**
 * Register a server method that can be used in wysywig
 * @param objects - the objects containing the method (ex: PMGHelper.MailMethods.<method> => ["PMGHelper","MailMethods"])
 * @param method - the method to add
 * @param schema - method's schema including : label, return type (optionnal) and the parameter's shemas
 */
type ServerGlobalMethodRegister = (
  objects: [string, ...string[]],
  method: string,
  schema: {
    label: string;
    returns?: string;
    parameters: { type: string; required: boolean }[];
  },
) => void;

interface ServerVariableMethod {
  parameters: {}[];
  returns: 'number' | 'string' | 'boolean' | undefined;
  serverCode: string;
}

interface ServerVariableMethodPayload extends ServerVariableMethod {
  variableClass: string;
  label: string;
}

interface ServerVariableMethods {
  [variableClass: string]: {
    [label: string]: ServerVariableMethod;
  };
}

type ServerVariableMethodRegister = (
  variableClass: string,
  label: string,
  parameters: {}[],
  returns: 'number' | 'string' | 'boolean' | undefined,
  serverCode: string,
) => void;

interface GlobalServerMethodClass {
  registerGlobalMethod: ServerGlobalMethodRegister;
  registerVariableMethod: ServerVariableMethodRegister;
}
