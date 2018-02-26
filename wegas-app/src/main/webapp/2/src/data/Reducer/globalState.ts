// import { Reducer } from 'redux';
import u from 'updeep';
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
const global = (
  state = u(
    {},
    {
      currentGameModelId: CurrentGM.id,
      currentUser: CurrentUser,
      pusherStatus: { status: 'disconnected' },
      pageEdit: false,
      pageSrc: false,
    },
  ),
  action: Actions,
): Readonly<GlobalState> => {
  switch (action.type) {
    case ActionType.VARIABLE_EDIT:
      return u(
        {
          editing: u.constant({
            type: 'Variable',
            id: action.id,
            schema: action.config,
            path: action.path,
          } as Edition),
        },
        state,
      );
    case ActionType.VARIABLE_CREATE:
      return u(
        {
          editing: u.constant({
            type: 'VariableCreate',
            '@class': action.payload['@class'],
            parentId: action.payload.parentId,
          } as Edition),
        },
        state,
      );
    case ActionType.PAGE_EDIT:
      return u(
        {
          editing: u.constant({
            type: 'Component',
            page: action.payload.page,
            path: action.payload.path,
          } as Edition),
        },
        state,
      );
    case ActionType.PAGE_SRC_MODE:
      return u({ pageSrc: action.payload }, state);
    case ActionType.PUSHER_SOCKET:
      return u({ pusherStatus: action.payload }, state);
    case ActionType.PAGE_EDIT_MODE:
      return u({ pageEdit: action.payload }, state);
  }
  return state;
};
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
  return { type: ActionType.VARIABLE_EDIT, id: entity.id, config, path };
}

/**
 * Create a variableDescriptor
 *
 * @export
 * @param {string} cls
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
