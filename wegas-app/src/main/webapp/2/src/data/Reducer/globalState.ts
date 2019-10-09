import u from 'immer';
import { Actions as ACTIONS, Actions } from '..';
import { ActionCreator, ActionType, StateActions } from '../actions';
import { VariableDescriptor } from '../selectors';
import { ThunkResult, store, getDispatch, StoreDispatch } from '../store';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { entityIsPersisted } from '../entities';
import { Reducer } from 'redux';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../../Editor/Components/FormView';

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
    };
export interface EditingState {
  editing?: Readonly<Edition>;
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
}

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
    case ActionType.CLOSE_EDITOR:
      return undefined;
    case ActionType.VARIABLE_CREATE:
      return {
        type: 'VariableCreate',
        '@class': action.payload['@class'],
        parentId: action.payload.parentId,
        parentType: action.payload.parentType,
        actions: action.payload.actions,
      };
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
      default:
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
  },
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
  actions: EditorAction<IVariableDescriptor> = {
    more: {
      delete: {
        label: 'delete',
        action: (entity: IVariableDescriptor, path?: string[]) => {
          store.dispatch(
            Actions.VariableDescriptorActions.deleteDescriptor(entity, path),
          );
        },
      },
      findUsage: {
        label: 'findUsage',
        action: (entity: IVariableDescriptor) => {
          if (entityIsPersisted(entity)) {
            store.dispatch(Actions.EditorActions.searchUsage(entity));
          }
        },
      },
    },
  },
) {
  return ActionCreator.VARIABLE_EDIT({
    entity,
    config,
    path,
    actions,
  });
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
) {
  return ActionCreator.FSM_EDIT({
    entity,
    config,
    path,
    actions: {
      more: {
        delete: {
          label: 'delete',
          action: (entity: IFSMDescriptor, path?: string[]) => {
            store.dispatch(
              Actions.VariableDescriptorActions.deleteDescriptor(entity, path),
            );
          },
        },
        findUsage: {
          label: 'findUsage',
          action: (entity: IFSMDescriptor) => {
            if (entityIsPersisted(entity)) {
              store.dispatch(Actions.EditorActions.searchUsage(entity));
            }
          },
        },
      },
    },
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
  parent?: IListDescriptor | IQuestionDescriptor | IChoiceDescriptor,
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
  return function save(_dispatch, getState) {
    const editMode = getState().global.editing;
    if (editMode == null) {
      return;
    }
    const globalDispatch = getDispatch() as StoreDispatch;
    switch (editMode.type) {
      case 'Variable':
        return globalDispatch(
          ACTIONS.VariableDescriptorActions.updateDescriptor(
            value as IVariableDescriptor,
          ),
        );
      case 'VariableCreate':
        return globalDispatch(
          ACTIONS.VariableDescriptorActions.createDescriptor(
            value as IVariableDescriptor,
            VariableDescriptor.select(editMode.parentId) as
              | IParentDescriptor
              | undefined,
          ),
        );
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
  return function(dispatch, getState) {
    dispatch(ActionCreator.SEARCH_ONGOING());
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.contains(gameModelId, value).then(result => {
      return dispatch(ActionCreator.SEARCH_GLOBAL({ search: value, result }));
    });
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
  return function(dispatch, getState) {
    dispatch(ActionCreator.SEARCH_ONGOING());
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.contains(gameModelId, search).then(result => {
      return dispatch(
        ActionCreator.SEARCH_USAGE({ variableId: variable.id, result }),
      );
    });
  };
}
