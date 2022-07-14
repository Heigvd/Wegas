import {
  IGame,
  IVariableDescriptor,
  ScriptableEntity,
  SGameModel,
  SPlayer,
  SVariableDescriptor,
  SVariableInstance,
} from 'wegas-ts-api';
import { SchemaPropsType } from '../PageComponents/tools/schemaProps';


interface GlobalVariableClass {
  find: <T extends IVariableDescriptor>(
    _gm: unknown,
    name: string,
  ) => ScriptableEntity<T> | undefined;
  select: <T extends SVariableDescriptor>(
    _gm: unknown,
    id: number,
  ) => T | undefined;
  getItems: <T = SVariableDescriptor<SVariableInstance>>(
    itemsIds: number[],
  ) => Readonly<T[]>;
}


export interface GlobalClasses {
  Error: typeof globalThis['Error'];
  Function: typeof globalThis['Function'];
  gameModel?: Readonly<SGameModel>;
  teams?: Readonly<Readonly<STeam>[]>;
  self?: Readonly<SPlayer>;
  schemaProps: SchemaPropsType;
  CurrentGame: IGame;
  API_VIEW: View;
  Variable: GlobalVariableClass;
  Editor: GlobalEditorClass;
  ClientMethods: GlobalClientMethodClass;
  ServerMethods: GlobalServerMethodClass;
  Schemas: GlobalSchemaClass;
  Classes: GlobalClassesClass;
  Popups: GlobalPopupClass;
  WegasEvents: WegasEventClass;
  I18n: GlobalI18nClass;
  Context: {
    [name: string]: unknown;
  };
  APIMethods: APIMethodsClass;
  Helpers: GlobalHelpersClass;
  Roles: RolesMehtods;
  wlog: (...args: unknown[]) => void;
  __WegasModules: {
    [moduleName: string]: {
      [exported: string]: unknown;
    };
  };
}

  export function createSandbox<T = unknown>() {
  const sandbox = document.createElement('iframe');
  // This is used to prevent unwanted modification from scripts.
  // One can still access main window from the sandbox
  // (window.top) and modify it from there.
  // to prevent such access, window, globalThis and top are hidden
  // by function parameters (see transpileToFunction function)
  sandbox.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  sandbox.style.display = 'none';
  document.body.appendChild(sandbox);

  if (sandbox.contentWindow != null) {
    const w = sandbox.contentWindow as any;
    // global object to to store esModule
    // will be hidden just like window, top and globalThis are
    w.__WegasModules = {};

    // to load esModule
    w.require = (moduleName: string) => {
      // get or create module
      let mod = w.__WegasModules[moduleName];
      if (mod == null) {
        mod = {};
        w.__WegasModules[moduleName] = mod;
      }
      // always return a proxy to
      //  1) allow importing before exporting
      //  2) prevent modifications
      return new Proxy(mod, { get: (m, key) => m[key] });
    };

    // Prevent http request by hiding fetch and XHR
    w.fetch = undefined;
    w.XMLHttpRequest = undefined;
    if (w.document != null) {
      // prevent creating new element
      // mainly to prenvent creating new iframe
      // (a way to get a brand new unrestricted window object)
      const doc = sandbox.contentWindow.document as any;
      doc.createElement = undefined;
      doc.createElementNS = undefined;
    }
  }
  return { sandbox, globals: sandbox.contentWindow as unknown as T };
}

export const { sandbox, globals } = createSandbox<GlobalClasses>();


export function clearModule(moduleName: string){
  delete globals.__WegasModules[moduleName];
}


