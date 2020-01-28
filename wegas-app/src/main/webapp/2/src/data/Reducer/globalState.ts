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

type actionFn<T extends IAbstractEntity> = (entity: T, path?: string[]) => void;
export interface EditorAction<T extends IAbstractEntity> {
  save?: (entity: T) => void;
  more?: {
    [id: string]: {
      label: React.ReactNode;
      action: actionFn<T>;
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
      cb: (updatedValue: IAbstractEntity) => void;
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
  pageEdit: Readonly<boolean>;
  pageSrc: Readonly<boolean>;
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
  methods: {
    [name: string]: Omit<GlobalMethodPayload, 'name'>;
  };
  schemas: {
    filtered: {
      [classFilter: string]: keyof GlobalState['schemas']['views'];
    };
    unfiltered: (keyof GlobalState['schemas']['views'])[];
    views: {
      [name: string]: CustomSchemaFN;
    };
  };
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
      case ActionType.PAGE_EDIT:
        state.editing = {
          type: 'Component',
          page: action.payload.page,
          path: action.payload.path,
          actions: {},
        };
        return;
      case ActionType.PAGE_LOAD_ID:
        state.currentPageId = action.payload;
        return;
      case ActionType.PAGE_INDEX:
        // if current page doesn't exist
        if (!action.payload.some(meta => meta.id === state.currentPageId)) {
          if (action.payload.length > 0) {
            // there is at lease 1 page
            state.currentPageId = action.payload[0].id;
          } else {
            state.currentPageId = undefined;
          }
        }
        return;
      case ActionType.PAGE_SRC_MODE:
        state.pageSrc = action.payload;
        return;
      case ActionType.PAGE_EDIT_MODE:
        state.pageEdit = action.payload;
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
      case ActionType.EDITOR_SET_METHOD:
        state.methods = {
          ...state.methods,
          [action.payload.name]: {
            types: action.payload.types,
            array: action.payload.array,
            method: action.payload.method,
          },
        };
        return;
      case ActionType.EDITOR_SET_SCHEMA: {
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
      }
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
    pageEdit: false,
    pageSrc: false,
    events: [],
    methods: {},
    schemas: {
      filtered: {},
      unfiltered: [],
      views: {},
    },
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
  return function(dispatch) {
    const currentActions: EditorAction<IVariableDescriptor> =
      actions != null
        ? actions
        : {
            more: {
              delete: {
                label: 'delete',
                action: (entity: IVariableDescriptor, path?: string[]) => {
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
  return function(dispatch) {
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
  cb: (updatedValue: IAbstractContentDescriptor) => void,
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

export function editComponent(page: string, path: string[]) {
  return ActionCreator.PAGE_EDIT({ page, path });
}
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
            .then((res: IAbstractContentDescriptor) => editMode.cb(res))
            .catch((res: Error) => {
              dispatch(ACTIONS.EditorActions.editorError(res.message));
            });
        });
    }
  };
}
/**
 * Set or unset page edit mode
 *
 * @export
 * @param {boolean} payload set it or not.
 */
export function pageEditMode(payload: boolean) {
  return ActionCreator.PAGE_EDIT_MODE(payload);
}
/**
 * Set or unset page edit mode
 *
 * @export
 * @param {boolean} payload set it or not.
 */
export function pageLoadId(payload?: string) {
  return ActionCreator.PAGE_LOAD_ID(payload);
}
/**
 * Set or unset page src mode
 *
 * @export
 * @param payload set it or not
 */
export function pageSrcMode(payload: boolean) {
  return ActionCreator.PAGE_SRC_MODE(payload);
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
  return function(dispatch) {
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
  return function(dispatch) {
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
 * Add a custom method to the gameModel's global state
 * @param name - the name of the method
 * @param method - the method to add
 */
export const setMethod = (
  name: GlobalMethodPayload['name'],
  types: GlobalMethodPayload['types'],
  array: GlobalMethodPayload['array'],
  method: GlobalMethodPayload['method'],
) => ActionCreator.EDITOR_SET_METHOD({ name, types, array, method });

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
  return ActionCreator.EDITOR_SET_SCHEMA({
    name,
    schemaFN,
    simpleFilter,
  });
}
