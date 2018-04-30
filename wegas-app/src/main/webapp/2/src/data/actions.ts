import { normalizeDatas, NormalizedData } from './normalize/index';
import { ManagedMode } from '../API/rest';
import { Schema } from 'jsoninput';
import * as ActionType from './actionTypes';

export { ActionType };

export namespace Actions {
  /**
   * Updated list from Managed-Mode.
   */
  export interface ENTITY_UPDATE {
    type: typeof ActionType.ENTITY_UPDATE;
    payload: NormalizedData;
  }
  export interface VARIABLE_EDIT {
    type: typeof ActionType.VARIABLE_EDIT;
    payload: {
      id: number;
      config?: Schema;
      path?: string[];
    };
  }
  export interface RESULT_EDIT {
    type: typeof ActionType.RESULT_EDIT;
    payload: {
      choiceId: number;
      id: number;
    };
  }
  export interface VARIABLE_CREATE {
    type: typeof ActionType.VARIABLE_CREATE;
    payload: { '@class': string; parentId?: number };
  }
  export interface MANAGED_MODE {
    type: typeof ActionType.MANAGED_MODE;
    payload: {
      deletedEntities: NormalizedData;
      updatedEntities: NormalizedData;
    };
  }
  export interface PAGE_EDIT_MODE {
    type: typeof ActionType.PAGE_EDIT_MODE;
    payload: boolean;
  }
  export interface PAGE_SRC_MODE {
    type: typeof ActionType.PAGE_SRC_MODE;
    payload: boolean;
  }
  export interface PAGE_EDIT {
    type: typeof ActionType.PAGE_EDIT;
    payload: {
      page: string;
      path: string[];
    };
  }
  export interface PAGE_FETCH {
    type: typeof ActionType.PAGE_FETCH;
    payload: {
      pages: Pages;
    };
  }
  export interface PUSHER_SOCKET {
    type: typeof ActionType.PUSHER_SOCKET;
    payload: {
      socket_id: string;
      status: string;
    };
  }
}
/** List all available action  */
export type Actions =
  | Actions.ENTITY_UPDATE
  | Actions.VARIABLE_EDIT
  | Actions.VARIABLE_CREATE
  | Actions.RESULT_EDIT
  | Actions.MANAGED_MODE
  | Actions.PAGE_EDIT_MODE
  | Actions.PAGE_SRC_MODE
  | Actions.PAGE_EDIT
  | Actions.PAGE_FETCH
  | Actions.PUSHER_SOCKET;

export function managedMode(payload: ManagedMode): Actions.MANAGED_MODE {
  return {
    type: ActionType.MANAGED_MODE,
    payload: {
      deletedEntities: normalizeDatas(payload.deletedEntities as any),
      updatedEntities: normalizeDatas(payload.updatedEntities as any),
    },
  };
}
