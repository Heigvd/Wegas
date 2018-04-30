// import { Reducer } from 'redux';
import u from 'immer';
import { ThunkAction } from 'redux-thunk';
import { VariableDescriptor } from '../selectors';
import { ActionType, Actions } from '../actions';
import { State } from './reducers';
import { Actions as ACTIONS } from '..';
import { Schema } from 'jsoninput';

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
 * @param {Actions} action
 * @returns {Readonly<GlobalState>}
 */
const global = u<GlobalState>(
  (state: GlobalState, action: Actions) => {
    switch (action.type) {
      case ActionType.VARIABLE_EDIT:
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
    currentGameModelId: CurrentGM.id,
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
): Actions.VARIABLE_EDIT {
  return {
    type: ActionType.VARIABLE_EDIT,
    payload: { id: entity.id, config, path },
  };
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
  parent?: IParentDescriptor,
): Actions.VARIABLE_CREATE {
  return {
    type: ActionType.VARIABLE_CREATE,
    payload: { '@class': cls, parentId: parent ? parent.id : undefined },
  };
}

export function editComponent(page: string, path: string[]): Actions.PAGE_EDIT {
  return {
    type: 'PAGE/EDIT',
    payload: { page, path },
  };
}
/**
 * Save the content from the editor
 *
 * @export
 * @param {IWegasEntity} value
 * @returns {ThunkAction<void, State, void>}
 */
export function saveEditor(
  value: IWegasEntity,
): ThunkAction<void, State, void> {
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
        dispatch(
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
export function pageEditMode(payload: boolean): Actions.PAGE_EDIT_MODE {
  return { type: ActionType.PAGE_EDIT_MODE, payload: payload };
}
/**
 * Set or unset page src mode
 *
 * @export
 * @param payload set it or not
 */
export function pageSrcMode(payload: boolean): Actions.PAGE_SRC_MODE {
  return { type: ActionType.PAGE_SRC_MODE, payload: payload };
}

export function updatePusherStatus(
  status: string,
  socket_id: string,
): Actions.PUSHER_SOCKET {
  return {
    type: ActionType.PUSHER_SOCKET,
    payload: { socket_id, status },
  };
}
