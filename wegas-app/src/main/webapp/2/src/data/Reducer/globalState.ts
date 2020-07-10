import u from 'immer';
import { Actions as ACTIONS, Actions } from '..';
import { ActionCreator, ActionType, StateActions } from '../actions';
import { VariableDescriptor } from '../selectors';
import { ThunkResult, store } from '../store';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { entityIsPersisted } from '../entities';
import { Reducer } from 'redux';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../../Editor/Components/FormView';
import { FileAPI } from '../../API/files.api';
import { omit } from 'lodash';
import { LockEventData } from '../../API/websocket';
import { WegasMethodParameter } from '../../Editor/editionConfig';

export function isServerMethod(
  serverObject: GlobalServerMethod | GlobalServerObject | undefined,
): serverObject is GlobalServerMethod {
  return (
    typeof serverObject === 'object' &&
    '@class' in serverObject &&
    serverObject['@class'] === 'GlobalServerMethod'
  );
}

export function buildGlobalServerMethods(
  serverObject: GlobalServerObject,
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

type actionFn<T extends IAbstractEntity> = (entity: T, path?: string[]) => void;
export interface EditorAction<T extends IAbstractEntity> {
  save?: (entity: T) => void;
  more?: {
    [id: string]: {
      label: React.ReactNode;
      action: actionFn<T>;
      confirm?: boolean;
    };
  };
}
export type Edition =
  | {
      type: 'Variable' | 'VariableFSM';
      entity: IAbstractEntity;
      config?: Schema<AvailableViews>;
      path?: (string | number)[];
      actions: EditorAction<IAbstractEntity>;
    }
  | {
      type: 'VariableCreate';
      '@class': string;
      parentId?: number;
      parentType?: string;
      config?: Schema<AvailableViews>;
      actions: EditorAction<IAbstractEntity>;
    }
  | {
      type: 'Component';
      page: string;
      path: (string | number)[];
      config?: Schema<AvailableViews>;
      actions: EditorAction<IAbstractEntity>;
    }
  | {
      type: 'File';
      entity: IAbstractContentDescriptor;
      cb?: (updatedValue: IAbstractEntity) => void;
    };
export interface EditingState {
  editing?: Readonly<Edition>;
  events: Readonly<WegasEvents[]>;
}
export interface GlobalState extends EditingState {
  currentGameModelId: number;
  currentGameId: number;
  currentPlayerId: number;
  currentTeamId: number;
  currentUser: Readonly<IUser>;
  currentPageId?: string;
  // pageEdit: Readonly<boolean>;
  // pageSrc: Readonly<boolean>;
  pageError?: Readonly<string>;
  search:
    | {
        type: 'GLOBAL';
        value: string;
        result: number[];
      }
    | {
        type: 'USAGE';
        value: number;
        result: number[];
      }
    | { type: 'ONGOING' }
    | { type: 'NONE' };
  pusherStatus: {
    status: string;
    socket_id?: string;
  };
  clientMethods: {
    [name: string]: Omit<ClientMethodPayload, 'name'>;
  };
  serverMethods: GlobalServerObject;
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
}

/**
 *
 * @param state
 * @param action
 */
export const eventManagement = (
  state: EditingState,
  action: StateActions,
): readonly WegasEvents[] => {
  switch (action.type) {
    case ActionType.EDITOR_ERROR_REMOVE: {
      const newEvents = [...state.events];
      if (newEvents.length > 0) {
        const currentEvent = newEvents[0];
        switch (currentEvent['@class']) {
          case 'ClientEvent':
            newEvents.pop();
            break;
          case 'ExceptionEvent': {
            if (currentEvent.exceptions.length > 0) {
              currentEvent.exceptions.pop();
            }
            if (currentEvent.exceptions.length === 0) {
              newEvents.pop();
            }
            break;
          }
        }
      }
      return newEvents;
    }
    case ActionType.EDITOR_ERROR:
      return [
        ...state.events,
        { '@class': 'ClientEvent', error: action.payload.error },
      ];
    case ActionType.MANAGED_RESPONSE_ACTION:
      return [...state.events, ...action.payload.events];
    default:
      return state.events;
  }
};

/**
 *  This is a separate switch-case only for editor actions management
 * @param state
 * @param action
 */
export const editorManagement = (
  state: EditingState,
  action: StateActions,
): Edition | undefined => {
  switch (action.type) {
    case ActionType.VARIABLE_EDIT:
    case ActionType.FSM_EDIT:
      return {
        type:
          action.type === ActionType.VARIABLE_EDIT ? 'Variable' : 'VariableFSM',
        entity: action.payload.entity,
        config: action.payload.config,
        path: action.payload.path,
        actions: action.payload.actions,
      };
    case ActionType.VARIABLE_CREATE:
      return {
        type: 'VariableCreate',
        '@class': action.payload['@class'],
        parentId: action.payload.parentId,
        parentType: action.payload.parentType,
        actions: action.payload.actions,
      };
    case ActionType.FILE_EDIT:
      return {
        type: 'File',
        ...action.payload,
      };
    case ActionType.CLOSE_EDITOR:
      return undefined;
    default:
      return state.editing;
  }
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
      case ActionType.SEARCH_CLEAR:
        state.search = { type: 'NONE' };
        return;
      case ActionType.SEARCH_ONGOING:
        state.search = { type: 'ONGOING' };
        return;
      case ActionType.SEARCH_GLOBAL:
        state.search = {
          type: 'GLOBAL',
          value: action.payload.search,
          result: action.payload.result,
        };
        return;
      case ActionType.SEARCH_USAGE:
        state.search = {
          type: 'USAGE',
          value: action.payload.variableId,
          result: action.payload.result,
        };
        return;
      case ActionType.PUSHER_SOCKET:
        state.pusherStatus = action.payload;
        return;
      case ActionType.EDITOR_SET_CLIENT_METHOD:
        state.clientMethods[action.payload.name] = {
          parameters: action.payload.parameters,
          returnTypes: action.payload.returnTypes,
          returnStyle: action.payload.returnStyle,
          method: action.payload.method,
        };
        return;
      case ActionType.EDITOR_REGISTER_SERVER_METHOD: {
        let objectKey = action.payload.objects.splice(0, 1)[0];
        let objects = state.serverMethods;
        while (objectKey != null) {
          if (
            objects[objectKey] == null ||
            isServerMethod(objects[objectKey])
          ) {
            objects[objectKey] = {};
          }
          objects = objects[objectKey] as GlobalServerObject;
          objectKey = action.payload.objects.splice(0, 1)[0];
          if (objectKey == null) {
            objects[action.payload.method] = action.payload.schema;
          }
        }
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
      case ActionType.LOCK_SET:
        state.locks[action.payload.token] = action.payload.locked;
        return;
      default:
        state.events = eventManagement(state, action);
        state.editing = editorManagement(state, action);
    }
    return state;
  },
  {
    currentGameModelId: CurrentGM.id!,
    currentGameId: CurrentGame.id!,
    currentPlayerId: CurrentPlayerId,
    currentTeamId: CurrentTeamId,
    currentUser: CurrentUser,
    pusherStatus: { status: 'disconnected' },
    search: { type: 'NONE' },
    events: [],
    clientMethods: {},
    serverMethods: {},
    schemas: {
      filtered: {},
      unfiltered: [],
      views: {},
    },
    pageLoaders: {},
    locks: {},
  } as GlobalState,
);
export default global;

//ACTIONS
/**
 * Edit VariableDescriptor
 * @param entity
 * @param path
 * @param config
 * @param actions
 */
export function editVariable(
  entity: IVariableDescriptor,
  path: (string | number)[] = [],
  config?: Schema<AvailableViews>,
  actions?: EditorAction<IVariableDescriptor>,
): ThunkResult {
  return function (dispatch) {
    const currentActions: EditorAction<IVariableDescriptor> =
      actions != null
        ? actions
        : {
            more: {
              delete: {
                label: 'Delete',
                action: (entity: IVariableDescriptor, path?: string[]) => {
                  dispatch(
                    Actions.VariableDescriptorActions.deleteDescriptor(
                      entity,
                      path,
                    ),
                  );
                },
                confirm: true,
              },
              findUsage: {
                label: 'Find usage',
                action: (entity: IVariableDescriptor) => {
                  if (entityIsPersisted(entity)) {
                    dispatch(Actions.EditorActions.searchUsage(entity));
                  }
                },
              },
            },
          };
    dispatch(
      ActionCreator.VARIABLE_EDIT({
        entity,
        config,
        path,
        actions: currentActions,
      }),
    );
  };
}
/**
 * Edit StateMachine
 * @param entity
 * @param path
 * @param config
 */
export function editStateMachine(
  entity: IFSMDescriptor,
  path: string[] = [],
  config?: Schema<AvailableViews>,
): ThunkResult {
  return function (dispatch) {
    dispatch(
      ActionCreator.FSM_EDIT({
        entity,
        config,
        path,
        actions: {
          more: {
            delete: {
              label: 'delete',
              action: (entity: IFSMDescriptor, path?: string[]) => {
                dispatch(
                  Actions.VariableDescriptorActions.deleteDescriptor(
                    entity,
                    path,
                  ),
                );
              },
            },
            findUsage: {
              label: 'findUsage',
              action: (entity: IFSMDescriptor) => {
                if (entityIsPersisted(entity)) {
                  dispatch(Actions.EditorActions.searchUsage(entity));
                }
              },
            },
          },
        },
      }),
    );
  };
}
/**
 * Edit File
 * @param entity
 * @param cb
 */
export function editFile(
  entity: IAbstractContentDescriptor,
  cb?: (updatedValue: IAbstractContentDescriptor) => void,
) {
  return ActionCreator.FILE_EDIT({
    entity,
    cb,
  });
}
/**
 * Create a variableDescriptor
 *
 * @export
 * @param {string} cls class
 * @returns
 */
export function createVariable(
  cls: string,
  parent?:
    | IListDescriptor
    | IQuestionDescriptor
    | IChoiceDescriptor
    | IWhQuestionDescriptor
    | IPeerReviewDescriptor,
  actions: EditorAction<IAbstractEntity> = {},
) {
  return ActionCreator.VARIABLE_CREATE({
    '@class': cls,
    parentId: parent ? parent.id : undefined,
    parentType: parent ? parent['@class'] : undefined,
    actions,
  });
}

// export function editComponent(page: string, path: string[]) {
//   return ActionCreator.PAGE_EDIT({ page, path });
// }
/**
 * Save the content from the editor
 *
 * The dispatch argument of the save function is not used to ensure that modifications are made in the global state
 *
 * @export
 * @param {IAbstractEntity} value
 * @returns {ThunkResult}
 */
export function saveEditor(value: IAbstractEntity): ThunkResult {
  return function save(dispatch, getState) {
    const editMode = getState().global.editing;
    if (editMode == null) {
      return;
    }
    switch (editMode.type) {
      case 'Variable':
      case 'VariableFSM':
        return dispatch(
          ACTIONS.VariableDescriptorActions.updateDescriptor(
            value as IVariableDescriptor,
          ),
        );
      case 'VariableCreate':
        return dispatch(
          ACTIONS.VariableDescriptorActions.createDescriptor(
            value as IVariableDescriptor,
            VariableDescriptor.select(editMode.parentId) as
              | IParentDescriptor
              | undefined,
          ),
        );
      case 'File':
        return dispatch(dispatch => {
          return FileAPI.updateMetadata(value as IAbstractContentDescriptor)
            .then((res: IAbstractContentDescriptor) => {
              dispatch(ACTIONS.EditorActions.editFile(res));
              editMode.cb && editMode.cb(res);
            })
            .catch((res: Error) => {
              dispatch(ACTIONS.EditorActions.editorError(res.message));
            });
        });
    }
  };
}

export function updatePusherStatus(status: string, socket_id: string) {
  return ActionCreator.PUSHER_SOCKET({ socket_id, status });
}

export function closeEditor() {
  return ActionCreator.CLOSE_EDITOR();
}

export function editorError(error: string) {
  return ActionCreator.EDITOR_ERROR({ error });
}

export function editorErrorRemove() {
  return ActionCreator.EDITOR_ERROR_REMOVE();
}

/**
 * Clear search values
 */
export function searchClear() {
  return ActionCreator.SEARCH_CLEAR();
}
/**
 * globally search for a value
 * @param value the text to search for
 */
export function searchGlobal(value: string): ThunkResult {
  return function (dispatch) {
    dispatch(ActionCreator.SEARCH_ONGOING());
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.contains(gameModelId, value)
      .then(result => {
        return dispatch(ActionCreator.SEARCH_GLOBAL({ search: value, result }));
      })
      .catch((res: Response) => dispatch(editorError(res.statusText)));
  };
}
/**
 * Find usage of a given descriptor
 * @param variable persisted descriptor to search for
 */
export function searchUsage(
  variable: IVariableDescriptor & { id: number },
): ThunkResult {
  const search = `Variable.find(gameModel, "${variable.name}")`;
  return function (dispatch) {
    store.dispatch(ActionCreator.SEARCH_ONGOING());
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.contains(gameModelId, search)
      .then(result => {
        return store.dispatch(
          ActionCreator.SEARCH_USAGE({ variableId: variable.id, result }),
        );
      })
      .catch((res: Response) => dispatch(editorError(res.statusText)));
  };
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
  objects: ServerMethodPayload['objects'],
  method: ServerMethodPayload['method'],
  schema?: ServerMethodPayload['schema'],
) =>
  ActionCreator.EDITOR_REGISTER_SERVER_METHOD({
    objects,
    method,
    schema,
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

export function setLock(data: LockEventData) {
  return ActionCreator.LOCK_SET({
    token: data.token,
    locked: data.status === 'lock',
  });
}
