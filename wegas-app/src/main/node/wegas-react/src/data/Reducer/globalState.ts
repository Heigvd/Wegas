import u from 'immer';
import { omit } from 'lodash';
import { Reducer } from 'redux';
import { IScript, IUser, WegasClassNames } from 'wegas-ts-api';
import { LockEventData } from '../../API/websocket';
import { WegasMethodParameter } from '../../Components/FormView/Script/editionConfig';
import { Popup } from '../../Components/PopupManager';
import { ActionCreator, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import {
  EditorLanguageData,
  EditorLanguagesCode,
  getSavedLanguage,
  getUserLanguage,
} from '../i18n';
import { commonServerMethods } from '../methods/CommonServerMethods';

interface Roles {
  [id: string]: Role;
}

export const DEFAULT_ROLES: Roles = {
  SCENARIO_EDITOR: {
    id: 'SCENARIO_EDITOR',
    label: {
      EN: 'Scenario editor',
      FR: 'Editeur de scenario',
      IT: 'Editore di scenario',
      DE: 'Redakteur für Szenario',
    },
    availableTabs: true,
  },
};

export function isServerMethod(
  serverObject: ServerGlobalMethod | ServerGlobalObject | undefined,
): serverObject is ServerGlobalMethod {
  return (
    typeof serverObject === 'object' &&
    '@class' in serverObject &&
    serverObject['@class'] === 'ServerGlobalMethod'
  );
}

export function buildGlobalServerMethods(
  serverObject: ServerGlobalObject,
): string {
  return Object.entries(serverObject)
    .filter(([, value]) => value != null)
    .reduce((old, [key, value], i, objects) => {
      if (value == null) {
        return old + '';
      } else if (isServerMethod(value)) {
        return (
          old +
          '\n\t' +
          `${key}: (${(value.parameters as WegasMethodParameter[])
            .map((p, i) => `arg${i}${p.required ? '' : '?'}: ${p.type}`)
            .join(', ')}) => ${value.returns ? value.returns : 'void'};${
            i === objects.length - 1 ? '\n' : ''
          }`
        );
      } else {
        return (
          old +
          (i > 0 ? '\n' : '') +
          `declare const ${key}: {${buildGlobalServerMethods(value)}}`
        );
      }
    }, '');
}

export const LoggerLevelValues = [
  'OFF' as const,
  'ERROR' as const,
  'WARN' as const,
  'LOG' as const,
  'INFO' as const,
  'DEBUG' as const,
];

export type LoggerLevel = typeof LoggerLevelValues[number];

export type WegasStatus = 'DOWN' | 'READY' | 'OUTDATED';

export interface GlobalState {
  currentGameModelId: number;
  currentGameId: number;
  currentPlayerId: number;
  currentTeamId: number;
  currentUser: Readonly<IUser>;
  currentPageId?: string;
  pageError?: string;
  search: { value: string | undefined; deep: boolean };
  pusherStatus: {
    status: string;
    socket_id?: string;
  };
  serverStatus: WegasStatus;
  clientMethods: {
    [name: string]: Omit<ClientMethodPayload, 'name'>;
  };
  serverMethods: ServerGlobalObject;
  serverVariableMethods: ServerVariableMethods;
  schemas: {
    filtered: {
      [classFilter: string]: keyof GlobalState['schemas']['views'];
    };
    unfiltered: (keyof GlobalState['schemas']['views'])[];
    views: {
      [name: string]: CustomSchemaFN;
    };
  };
  pageLoaders: { [name: string]: IScript };
  locks: { [token: string]: boolean };
  roles: {
    rolesId: string;
    defaultRoleId: string;
    roles: Roles;
  };
  popups: { [id: string]: Popup };
  languages: {
    currentEditorLanguageCode: EditorLanguagesCode;
    translatableLanguages: undefined | 'loading' | string[];
    editableLanguages: undefined | 'loading' | 'all' | string[];
  };
  logLevels: Record<string, LoggerLevel>;
  eventsHandlers: WegasEventHandlers;
}

const defaultGlobalState: GlobalState = {
  currentGameModelId: CurrentGM.id!,
  currentGameId: CurrentGame.id!,
  currentPlayerId: CurrentPlayerId,
  currentTeamId: CurrentTeamId,
  currentUser: CurrentUser,
  pusherStatus: { status: 'disconnected' },
  serverStatus: 'READY',
  search: { value: undefined, deep: false },
  clientMethods: {},
  serverMethods: { ...commonServerMethods },
  serverVariableMethods: {},
  schemas: {
    filtered: {},
    unfiltered: [],
    views: {},
  },
  pageLoaders: {},
  locks: {},
  roles: {
    rolesId: 'DEFAULT_ROLES',
    defaultRoleId: DEFAULT_ROLES.SCENARIO_EDITOR.id,
    roles: DEFAULT_ROLES,
  },
  popups: {},
  languages: {
    currentEditorLanguageCode: 'EN',
    editableLanguages: undefined,
    translatableLanguages: undefined,
  },
  logLevels: {
    default: 'LOG',
  },
  eventsHandlers: {
    ExceptionEvent: {},
    ClientEvent: {},
    CustomEvent: {},
    EntityDestroyedEvent: {},
    EntityUpdatedEvent: {},
    OutdatedEntitiesEvent: {},
  },
};

/**
 * Reducer for editor's state
 *
 * @param {any} [state=u({}, { currentGameModelId: CurrentGM.id })]
 * @param {StateActions} action
 * @returns {Readonly<GlobalState>}
 */
const global: Reducer<Readonly<GlobalState>> = u(
  (state: GlobalState, action: StateActions) => {
    switch (action.type) {
      case ActionType.PAGE_ERROR:
        state.pageError = action.payload.error;
        return;
      case ActionType.SEARCH:
        state.search.value = action.payload.searchString;
        return;
      case ActionType.SEARCH_DEEP:
        state.search.value = action.payload.searchString;
        state.search.deep = true;
        return;
      case ActionType.SEARCH_SET_DEEP:
        state.search.deep = action.payload.deep;
        return;
      case ActionType.PUSHER_SOCKET:
        state.pusherStatus = action.payload;
        return;
      case ActionType.SERVER_STATUS:
        state.serverStatus = action.payload.status;
        return;
      case ActionType.EDITOR_SET_CLIENT_METHOD:
        state.clientMethods[action.payload.name] = {
          parameters: action.payload.parameters,
          returnTypes: action.payload.returnTypes,
          returnStyle: action.payload.returnStyle,
          method: action.payload.method,
        };
        return;
      case ActionType.EDITOR_REGISTER_SERVER_GLOBAL_METHOD: {
        let objectKey = action.payload.objects.splice(0, 1)[0];
        let objects = state.serverMethods;
        while (objectKey != null) {
          if (
            objects[objectKey] == null ||
            isServerMethod(objects[objectKey])
          ) {
            objects[objectKey] = {};
          }
          objects = objects[objectKey] as ServerGlobalObject;
          objectKey = action.payload.objects.splice(0, 1)[0];
          if (objectKey == null) {
            objects[action.payload.method] = action.payload.schema;
          }
        }
        return;
      }
      case ActionType.EDITOR_REGISTER_SERVER_VARIABLE_METHOD: {
        const { variableClass, label, ...content } = action.payload;
        state.serverVariableMethods[variableClass][label] = content;
        return;
      }
      case ActionType.EDITOR_SET_VARIABLE_SCHEMA: {
        const filters = state.schemas.filtered;
        const views = state.schemas.views;

        // Always remove previous schema with the same name
        state.schemas.views = omit(views, action.payload.name);
        const removedClassFilter = Object.keys(filters).find(
          k => filters[k] === action.payload.name,
        );
        if (removedClassFilter !== undefined) {
          state.schemas.filtered = omit(filters, removedClassFilter);
        }
        state.schemas.unfiltered = state.schemas.unfiltered.filter(
          s => s !== action.payload.name,
        );

        // If function is defined, insert it into the views
        if (action.payload.schemaFN !== undefined) {
          state.schemas.views[action.payload.name] = action.payload.schemaFN;
          // If a simple filter is set, map the schema name with the entity class name
          if (action.payload.simpleFilter !== undefined) {
            state.schemas.filtered[action.payload.simpleFilter] =
              action.payload.name;
          } else {
            state.schemas.unfiltered.push(action.payload.name);
          }
        }
        return;
        //         case ActionType.EDITOR_SET_VARIABLE_METHOD: {
        // return}
      }
      case ActionType.EDITOR_REGISTER_PAGE_LOADER:
        state.pageLoaders[action.payload.name] = action.payload.pageId;
        return;
      case ActionType.EDITOR_RESET_PAGE_LOADER:
        state.pageLoaders = {};
        return;
      case ActionType.EDITOR_UNREGISTER_PAGE_LOADER:
        delete state.pageLoaders[action.payload.name];
        return;
      case ActionType.EDITOR_SET_LANGUAGE:
        state.languages.currentEditorLanguageCode = action.payload.language;
        return;
      case ActionType.EDITOR_SET_ROLES:
        state.roles.roles = action.payload.roles;
        state.roles.defaultRoleId = action.payload.defaultRoleId;
        state.roles.rolesId = action.payload.rolesId;
        return;
      case ActionType.LOCK_SET:
        state.locks[action.payload.token] = action.payload.locked;
        return;
      case ActionType.ADD_POPUP: {
        state.popups[action.payload.id] = action.payload;
        return;
      }
      case ActionType.REMOVE_POPUP: {
        state.popups = omit(state.popups, action.payload.id);
        return;
      }

      case ActionType.LANGUAGES_EDITON_ALLOWED: {
        state.languages.editableLanguages = action.payload.editableLanguages;
        return;
      }
      case ActionType.LANGUAGES_TRANSLATION_AVAILABLE: {
        state.languages.translatableLanguages =
          action.payload.translatableLanguages;
        return;
      }

      case ActionType.LOGGER_LEVEL_SET: {
        state.logLevels[action.payload.loggerName] = action.payload.level;
        return;
      }
      case ActionType.EDITOR_ADD_EVENT_HANDLER:
        state.eventsHandlers[action.payload.type][action.payload.id] =
          action.payload.cb;
        break;
      case ActionType.EDITOR_REMOVE_EVENT_HANDLER:
        state.eventsHandlers[action.payload.type] = omit(
          state.eventsHandlers[action.payload.type],
          action.payload.id,
        );
        break;
    }
  },
  defaultGlobalState,
);
export default global;

export function updatePusherStatus(status: string, socket_id: string) {
  return ActionCreator.PUSHER_SOCKET({ socket_id, status });
}

export function updateServerStatus(status: WegasStatus) {
  return ActionCreator.SERVER_STATUS({ status });
}

export function search(searchString: string) {
  return ActionCreator.SEARCH({ searchString });
}

export function clearSearch() {
  return ActionCreator.SEARCH({ searchString: undefined });
}

export function searchDeep(searchString: string) {
  return ActionCreator.SEARCH_DEEP({ searchString });
}

export function searchSetDeep(deep: boolean) {
  return ActionCreator.SEARCH_SET_DEEP({ deep });
}

/**
 * Add a custom client method that can be used in client scripts
 * @param name - the name of the method
 * @param types - the returned types of the method
 * @param array - the method will return a signle object or an array of objects
 * @param method - the method to add
 */
export const setClientMethod = (
  name: ClientMethodPayload['name'],
  parameters: ClientMethodPayload['parameters'],
  types: ClientMethodPayload['returnTypes'],
  array: ClientMethodPayload['returnStyle'],
  method: ClientMethodPayload['method'],
) =>
  ActionCreator.EDITOR_SET_CLIENT_METHOD({
    name,
    parameters,
    returnTypes: types,
    returnStyle: array,
    method,
  });

/**
 * Register a server method that can be used in wysywig
 * @param objects - the objects containing the method (ex: PMGHelper.MailMethods.<method> => ["PMGHelper","MailMethods"])
 * @param method - the method to add
 * @param schema - method's schema including : label, return type (optionnal) and the parameter's shemas
 */
export const registerServerMethod = (
  objects: ServerGlobalMethodPayload['objects'],
  method: ServerGlobalMethodPayload['method'],
  schema?: ServerGlobalMethodPayload['schema'],
) =>
  ActionCreator.EDITOR_REGISTER_SERVER_GLOBAL_METHOD({
    objects,
    method,
    schema,
  });

/**
 * Register a server method that can be used in wysywig
 * @param objects - the objects containing the method (ex: PMGHelper.MailMethods.<method> => ["PMGHelper","MailMethods"])
 * @param method - the method to add
 * @param schema - method's schema including : label, return type (optionnal) and the parameter's shemas
 */
export const registerVariableMethod = (
  variableClass: ServerVariableMethodPayload['variableClass'],
  label: ServerVariableMethodPayload['label'],
  parameters: ServerVariableMethodPayload['parameters'],
  returns: ServerVariableMethodPayload['returns'],
  serverCode: ServerVariableMethodPayload['serverCode'],
) =>
  ActionCreator.EDITOR_REGISTER_SERVER_VARIABLE_METHOD({
    variableClass,
    label,
    parameters,
    returns,
    serverCode,
  });

/**
 * setSchema - Sets a custom view for WegasEntities in form components
 * @param name - The name of the custom schema. Allows to override a previous custom schema.
 * @param schemaFN - The function that returns the customized schema. If no simplefilter is sat it should return something only when matches internal function filter (using the entity arg).
 * @param simpleFilter - A simple filter over a WegasEntity. Always use this one first if you want your view to be used with all entity of a certain class. Don't use it if you want your schema to be used with more than one entity.
 */
export function setSchema(
  name: string,
  schemaFN?: CustomSchemaFN,
  simpleFilter?: WegasClassNames,
) {
  return ActionCreator.EDITOR_SET_VARIABLE_SCHEMA({
    name,
    schemaFN,
    simpleFilter,
  });
}

/**
 * registerPageLoader - stores a script that returns a page id for every page loaders
 * @param name
 * @param pageId
 */
export function registerPageLoader(name: string, pageId: IScript) {
  return ActionCreator.EDITOR_REGISTER_PAGE_LOADER({ name, pageId });
}

/**
 * resetPageLoader - resets every pageLoaders
 */
export function resetPageLoader() {
  return ActionCreator.EDITOR_RESET_PAGE_LOADER();
}

export function setLock(data: LockEventData) {
  return ActionCreator.LOCK_SET({
    token: data.token,
    locked: data.status === 'lock',
  });
}
export function getEditorLanguage() {
  const savedLanguage = getSavedLanguage();
  const userLanguage = getUserLanguage();
  return ActionCreator.EDITOR_SET_LANGUAGE({
    language: savedLanguage ? savedLanguage : userLanguage,
  });
}

export function setEditorLanguage(lang: EditorLanguagesCode) {
  window.localStorage.setItem(EditorLanguageData, lang);
  return ActionCreator.EDITOR_SET_LANGUAGE({ language: lang });
}
