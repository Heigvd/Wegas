import u, { Immutable, produce } from 'immer';
import { Actions as ACTIONS, Actions } from '..';
import {
  ActionCreator,
  ActionType,
  StateActions,
  triggerEventHandlers,
} from '../actions';
import { VariableDescriptor } from '../selectors';
import { ThunkResult, store } from '../Stores/store';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { entityIsPersisted } from '../entities';
import { Reducer } from 'redux';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../../Editor/Components/FormView';
import { FileAPI } from '../../API/files.api';
import { omit } from 'lodash';
import { LockEventData } from '../../API/websocket';
import { WegasMethodParameter } from '../../Editor/editionConfig';
import {
  IAbstractEntity,
  IAbstractContentDescriptor,
  IUser,
  IScript,
  IVariableDescriptor,
  IFSMDescriptor,
  IListDescriptor,
  IQuestionDescriptor,
  IChoiceDescriptor,
  IWhQuestionDescriptor,
  IPeerReviewDescriptor,
  WegasClassNames,
  IAbstractStateMachineDescriptor,
  IAbstractState,
  IAbstractTransition,
  IDialogueDescriptor,
} from 'wegas-ts-api';
import { cloneDeep } from 'lodash-es';
import { commonServerMethods } from '../methods/CommonServerMethods';

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

export interface VariableEdition {
  type: 'Variable' | 'VariableFSM';
  entity: IAbstractEntity;
  config?: Schema<AvailableViews>;
  path?: (string | number)[];
  actions: EditorAction<IAbstractEntity>;
}

export interface VariableCreateEdition {
  type: 'VariableCreate';
  '@class': IVariableDescriptor['@class'];
  parentId?: number;
  parentType?: string;
  config?: Schema<AvailableViews>;
  actions: EditorAction<IAbstractEntity>;
}

export interface ComponentEdition {
  type: 'Component';
  page: string;
  path: (string | number)[];
  config?: Schema<AvailableViews>;
  actions: EditorAction<IAbstractEntity>;
}

export interface FileEdition {
  type: 'File';
  entity: IAbstractContentDescriptor;
  cb?: (updatedValue: IMergeable) => void;
}

export type Edition =
  | VariableEdition
  | VariableCreateEdition
  | ComponentEdition
  | FileEdition;
export interface EditingState {
  editing?: Edition;
  events: WegasEvent[];
  eventsHandlers: WegasEventHandlers;
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
  pageError?: string;
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
}

export function eventHandlersManagement(
  state: EditingState,
  action: StateActions,
): WegasEventHandlers {
  switch (action.type) {
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
  return state.eventsHandlers;
}

/**
 *
 * @param state
 * @param action
 */
export function eventManagement(
  state: EditingState,
  action: StateActions,
): WegasEvent[] {
  switch (action.type) {
    case ActionType.MANAGED_RESPONSE_ACTION:
      return [...state.events, ...action.payload.events];
    case ActionType.EDITOR_EVENT_REMOVE: {
      const newEvents = [...state.events];
      const indexOfRemoved = newEvents.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (indexOfRemoved !== -1) {
        newEvents.splice(indexOfRemoved, 1);
      }
      return newEvents;
    }
    case ActionType.EDITOR_EVENT_READ: {
      const readEventIndex = state.events.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (readEventIndex !== -1) {
        const event = cloneDeep(state.events[readEventIndex]);
        const before = state.events.slice(0, readEventIndex);
        const after = state.events.slice(readEventIndex + 1);
        const ret = [...before, { ...event, unread: false }, ...after];
        return ret;
      } else {
        return state.events;
      }
    }
    case ActionType.EDITOR_EVENT:
      return [...state.events, action.payload];
    default:
      return state.events;
  }
}

/**
 *  This is a separate switch-case only for editor actions management
 * @param state
 * @param action
 */
export function editorManagement(
  state: EditingState,
  action: StateActions,
): Edition | undefined {
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
        '@class': action.payload['@class'] as IVariableDescriptor['@class'],
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
}

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
      case ActionType.LOCK_SET:
        state.locks[action.payload.token] = action.payload.locked;
        return;
      // case ActionType.EDITOR_ADD_EVENT_HANDLER:
      //   state.eventsHandlers[action.payload.type][action.payload.id] =
      //     action.payload.cb;
      //   return;
      // case ActionType.EDITOR_REMOVE_EVENT_HANDLER:
      //   state.eventsHandlers[action.payload.type] = omit(
      //     state.eventsHandlers[action.payload.type],
      //     action.payload.id,
      //   );
      //   return;
      default:
        state.eventsHandlers = eventHandlersManagement(state, action);
        state.events = eventManagement(state, action);
        state.editing = editorManagement(state, action);
    }
    // return state;
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
    eventsHandlers: {
      ExceptionEvent: {},
      ClientEvent: {},
      CustomEvent: {},
      EntityDestroyedEvent: {},
      EntityUpdatedEvent: {},
      OutdatedEntitiesEvent: {},
    },
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
              duplicate: {
                label: 'Duplicate',
                action: (entity: IVariableDescriptor) => {
                  dispatch(
                    Actions.VariableDescriptorActions.duplicateDescriptor(
                      entity,
                    ),
                  );
                },
              },
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

export function deleteState<T extends IFSMDescriptor | IDialogueDescriptor>(
  stateMachine: Immutable<T>,
  id: number,
) {
  const newStateMachine = produce((stateMachine: T) => {
    const { states } = stateMachine;
    delete states[id];
    // delete transitions pointing to deleted state
    for (const s in states) {
      (states[s] as IAbstractState).transitions = (states[s]
        .transitions as IAbstractTransition[]).filter(
        t => t.nextStateId !== id,
      );
    }
  })(stateMachine);

  store.dispatch(
    Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
  );
}

/**
 * Edit StateMachine
 * @param entity
 * @param path
 * @param config
 */
export function editStateMachine(
  entity: Immutable<IAbstractStateMachineDescriptor>,
  path: string[] = [],
  config?: Schema<AvailableViews>,
  actions?: EditorAction<IVariableDescriptor>,
): ThunkResult {
  return function (dispatch) {
    const deleteAction = {
      label: 'Delete',
      confirm: true,
      action: (entity: IFSMDescriptor, path?: string[]) => {
        if (
          path != null &&
          Number(path.length) === 2 &&
          Number(path.length) !== entity.defaultInstance.currentStateId
        ) {
          deleteState(entity, Number(path[1]));
        } else {
          dispatch(
            Actions.VariableDescriptorActions.deleteDescriptor(entity, path),
          );
        }
      },
    };

    dispatch(
      ActionCreator.FSM_EDIT({
        entity,
        config,
        path,
        actions: actions || {
          more: {
            delete: deleteAction,
            // {
            //   label: 'Delete',
            //   confirm: true,
            //   action: (entity: IFSMDescriptor, path?: string[]) => {
            //     dispatch(
            //       Actions.VariableDescriptorActions.deleteDescriptor(
            //         entity,
            //         path,
            //       ),
            //     );
            //   },
            // },
            findUsage: {
              label: 'Find usage',
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
  cls: IAbstractEntity['@class'],
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
export function saveEditor(value: IMergeable): ThunkResult {
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
              dispatch(ACTIONS.EditorActions.editorErrorEvent(res.message));
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

export function editorEvent(anyEvent: WegasEvents[keyof WegasEvents]) {
  const event: WegasEvent = {
    ...anyEvent,
    timestamp: new Date().getTime(),
    unread: true,
  };
  triggerEventHandlers(event);
  return ActionCreator.EDITOR_EVENT(event);
}

export function editorErrorEvent(error: string) {
  return editorEvent({ '@class': 'ClientEvent', error });
}

export function editorEventRemove(timestamp: number) {
  return ActionCreator.EDITOR_EVENT_REMOVE({ timestamp });
}

export function editorEventRead(timestamp: number) {
  return ActionCreator.EDITOR_EVENT_READ({ timestamp });
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
      .catch((res: Response) => dispatch(editorErrorEvent(res.statusText)));
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
      .catch((res: Response) => dispatch(editorErrorEvent(res.statusText)));
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
