import { normalizeDatas, NormalizedData } from './normalize';
import { ManagedMode } from '../API/rest';
import * as ActionType from './actionTypes';
import { PageIndex } from '../API/pages.api';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../Editor/Components/FormView';

export { ActionType };
export type ActionTypeValues = ValueOf<typeof ActionType>;

function createAction<T extends ActionTypeValues, P>(type: T, payload: P) {
  return {
    type,
    payload,
  };
}
const variableEditAction = <TA extends ActionTypeValues>(type: TA) => <
  TE extends IAbstractEntity
>(data: {
  entity: TE;
  config?: Schema<AvailableViews>;
  path?: TA extends ValueOf<typeof ActionType.FSM_EDIT>
    ? (string)[]
    : (string | number)[];
  actions: {
    save?: (entity: TE) => void;
    more?: {
      [id: string]: {
        label: React.ReactNode;
        action: (entity: TE, path: string[]) => void;
      };
    };
  };
}) => createAction(type, data);
/**
 * Simple action creators.
 */
export const ActionCreator = {
  // ENTITY_UPDATE: (data: NormalizedData) =>
  //   createAction(ActionType.ENTITY_UPDATE, data),
  VARIABLE_EDIT: variableEditAction(ActionType.VARIABLE_EDIT),
  FSM_EDIT: variableEditAction(ActionType.FSM_EDIT),
  VARIABLE_CREATE: <T extends IAbstractEntity>(data: {
    '@class': string;
    parentId?: number;
    parentType?: string;
    actions: {
      save?: (entity: T) => void;
      delete?: (entity: T) => void;
    };
  }) => createAction(ActionType.VARIABLE_CREATE, data),
  CLOSE_EDITOR: () => createAction(ActionType.CLOSE_EDITOR, {}),
  MANAGED_MODE: (data: {
    // Nearly empty shells
    deletedEntities: {
      [K in keyof NormalizedData]: { [id: string]: IAbstractEntity };
    };
    updatedEntities: NormalizedData;
  }) => createAction(ActionType.MANAGED_MODE, data),
  PAGE_EDIT_MODE: (data: boolean) =>
    createAction(ActionType.PAGE_EDIT_MODE, data),
  PAGE_LOAD_ID: (data?: string) => createAction(ActionType.PAGE_LOAD_ID, data),
  PAGE_INDEX: (data: PageIndex) => createAction(ActionType.PAGE_INDEX, data),
  PAGE_SRC_MODE: (data: boolean) =>
    createAction(ActionType.PAGE_SRC_MODE, data),
  PAGE_EDIT: (data: { page: string; path: string[] }) =>
    createAction(ActionType.PAGE_EDIT, data),
  PAGE_FETCH: (data: { pages: Pages }) =>
    createAction(ActionType.PAGE_FETCH, data),
  SEARCH_CLEAR: () => createAction(ActionType.SEARCH_CLEAR, {}),
  SEARCH_ONGOING: () => createAction(ActionType.SEARCH_ONGOING, {}),
  SEARCH_GLOBAL: (data: { search: string; result: number[] }) =>
    createAction(ActionType.SEARCH_GLOBAL, data),
  SEARCH_USAGE: (data: { variableId: number; result: number[] }) =>
    createAction(ActionType.SEARCH_USAGE, data),
  PUSHER_SOCKET: (data: { socket_id: string; status: string }) =>
    createAction(ActionType.PUSHER_SOCKET, data),
  GAMEMODEL_EDIT: (data: { gameModel: IGameModel; gameModelId: string }) =>
    createAction(ActionType.GAMEMODEL_EDIT, data),
  LANGUAGE_EDIT: (data: {
    gameModelLanguage: IGameModelLanguage;
    gameModelId: string;
  }) => createAction(ActionType.LANGUAGE_EDIT, data),
};

export type StateActions<
  A extends keyof typeof ActionCreator = keyof typeof ActionCreator
> = ReturnType<typeof ActionCreator[A]>;

export function managedMode(payload: ManagedMode) {
  return ActionCreator.MANAGED_MODE({
    deletedEntities: normalizeDatas(payload.deletedEntities),
    updatedEntities: normalizeDatas(payload.updatedEntities),
  });
}
