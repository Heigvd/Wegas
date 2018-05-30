// import { Reducer } from 'redux';
import u from 'immer';
import { Schema } from 'jsoninput';
import { Actions as ACTIONS } from '..';
import { ActionCreator, ActionType, StateActions } from '../actions';
import { VariableDescriptor } from '../selectors';
import { ThunkResult } from '../store';

type Edition =
  | { type: 'Variable'; id: number; config?: Schema; path?: string[] }
  | {
      type: 'VariableCreate';
      '@class': string;
      parentId?: number;
    }
  | { type: 'Component'; page: string; path: string[] };
export interface GlobalState {
  currentGameModelId: number;
  currentUser: Readonly<IUser>;
  editing?: Readonly<Edition>;
  stateMachineEditor?: {
    id: number;
  };
  pageEdit: Readonly<boolean>;
  pageSrc: Readonly<boolean>;
  pusherStatus: {
    status: string;
    socket_id?: string;
  };
}
/**
 * Reducer for editor's state
 *
 * @param {any} [state=u({}, { currentGameModelId: CurrentGM.id })]
 * @param {StateActions} action
 * @returns {Readonly<GlobalState>}
 */
const global = u<GlobalState>(
  (state: GlobalState, action: StateActions) => {
    switch (action.type) {
      case ActionType.VARIABLE_EDIT:
        state.editing = {
          type: 'Variable',
          id: action.payload.id,
          config: action.payload.config,
          path: action.payload.path,
        };
        return;
      case ActionType.FSM_EDIT:
        state.stateMachineEditor = { id: action.payload.id };
        state.editing = {
          type: 'Variable',
          id: action.payload.id,
          config: action.payload.config,
          path: action.payload.path,
        };
        return;
      case ActionType.VARIABLE_CREATE:
        state.editing = {
          type: 'VariableCreate',
          '@class': action.payload['@class'],
          parentId: action.payload.parentId,
        };
        return;
      case ActionType.PAGE_EDIT:
        state.editing = {
          type: 'Component',
          page: action.payload.page,
          path: action.payload.path,
        };
        return;
      case ActionType.PAGE_SRC_MODE:
        state.pageSrc = action.payload;
        return;
      case ActionType.PUSHER_SOCKET:
        state.pusherStatus = action.payload;
        return;
      case ActionType.PAGE_EDIT_MODE:
        state.pageEdit = action.payload;
        return;
    }
    return state;
  },
  {
    currentGameModelId: CurrentGM.id!,
    currentUser: CurrentUser,
    pusherStatus: { status: 'disconnected' },
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
 */
export function editVariable(
  entity: IVariableDescriptor,
  path: string[] = [],
  config?: Schema,
) {
  return ActionCreator.VARIABLE_EDIT({
    id: entity.id!,
    config,
    path,
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
  config?: Schema,
) {
  return ActionCreator.FSM_EDIT({
    id: entity.id!,
    config,
    path,
  });
}

/**
 * Create a variableDescriptor
 *
 * @export
 * @param {string} cls class
 * @returns
 */
export function createVariable(cls: string, parent?: IParentDescriptor) {
  return ActionCreator.VARIABLE_CREATE({
    '@class': cls,
    parentId: parent ? parent.id : undefined,
  });
}

export function editComponent(page: string, path: string[]) {
  return ActionCreator.PAGE_EDIT({ page, path });
}
/**
 * Save the content from the editor
 *
 * @export
 * @param {IWegasEntity} value
 * @returns {ThunkResult}
 */
export function saveEditor(value: IWegasEntity): ThunkResult {
  return function save(dispatch, getState) {
    const editMode = getState().global.editing;
    if (editMode == null) {
      return;
    }
    switch (editMode.type) {
      case 'Variable':
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
