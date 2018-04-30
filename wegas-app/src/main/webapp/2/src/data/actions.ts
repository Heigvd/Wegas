import { normalizeDatas, NormalizedData } from './normalize/index';
import { ManagedMode } from '../API/rest';
import { Schema } from 'jsoninput';
import * as ActionType from './actionTypes';

export { ActionType };
function createAction<T extends string, P>(type: T, payload: P) {
  return {
    type,
    payload,
  };
}
export const ActionCreator = {
  ENTITY_UPDATE: (data: NormalizedData) =>
    createAction(ActionType.ENTITY_UPDATE, data),
  VARIABLE_EDIT: (data: { id: number; config?: Schema; path?: string[] }) =>
    createAction(ActionType.VARIABLE_EDIT, data),
  RESULT_EDIT: (data: { choiceId: number; id: number }) =>
    createAction(ActionType.RESULT_EDIT, data),
  VARIABLE_CREATE: (data: { '@class': string; parentId?: number }) =>
    createAction(ActionType.VARIABLE_CREATE, data),
  MANAGED_MODE: (data: {
    deletedEntities: NormalizedData;
    updatedEntities: NormalizedData;
  }) => createAction(ActionType.MANAGED_MODE, data),
  PAGE_EDIT_MODE: (data: boolean) =>
    createAction(ActionType.PAGE_EDIT_MODE, data),
  PAGE_SRC_MODE: (data: boolean) =>
    createAction(ActionType.PAGE_SRC_MODE, data),
  PAGE_EDIT: (data: { page: string; path: string[] }) =>
    createAction(ActionType.PAGE_EDIT, data),
  PAGE_FETCH: (data: { pages: Pages }) =>
    createAction(ActionType.PAGE_FETCH, data),
  PUSHER_SOCKET: (data: { socket_id: string; status: string }) =>
    createAction(ActionType.PUSHER_SOCKET, data),
};

type ActionsUnion<
  A extends { [key: string]: (...args: any[]) => any }
> = ReturnType<A[keyof A]>;

export type Actions = ActionsUnion<typeof ActionCreator>;

export function managedMode(payload: ManagedMode) {
  return ActionCreator.MANAGED_MODE({
    deletedEntities: normalizeDatas(payload.deletedEntities as any),
    updatedEntities: normalizeDatas(payload.updatedEntities as any),
  });
}
