import { Schema } from 'jsoninput';
import {
  IAbstractContentDescriptor,
  IAbstractEntity,
  IGame,
  IGameModel,
  IGameModelLanguage,
  IScript,
  ITeam,
  WegasClassNames,
} from 'wegas-ts-api';
import { IManagedResponse } from '../API/rest';
import { shallowDifferent } from '../Components/Hooks/storeHookFactory';
import { AvailableViews } from '../Editor/Components/FormView';
import { getEntityActions } from '../Editor/editionConfig';
import * as ActionType from './actionTypes';
import { discriminant, normalizeDatas, NormalizedData } from './normalize';
import {
  closeEditor,
  EditingState,
  Edition,
  EditorAction,
} from './Reducer/globalState';
import { VariableDescriptorState } from './Reducer/VariableDescriptorReducer';
import { StoreDispatch, store } from './Stores/store';

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
    ? string[]
    : (string | number)[];
  actions: EditorAction<TE>;
  // {
  //   save?: (entity: TE) => void;
  //   more?: {
  //     [id: string]: {
  //       label: React.ReactNode;
  //       action: (entity: TE, path: string[]) => void;
  //     };
  //   };
  // };
}) => createAction(type, data);

/**
 * Simple action creators.
 */
export const ActionCreator = {
  // ENTITY_UPDATE: (data: NormalizedData) =>
  //   createAction(ActionType.ENTITY_UPDATE, data),
  EDITOR_EVENT_REMOVE: (data: { timestamp: number }) =>
    createAction(ActionType.EDITOR_EVENT_REMOVE, data),
  EDITOR_EVENT_READ: (data: { timestamp: number }) =>
    createAction(ActionType.EDITOR_EVENT_READ, data),
  EDITOR_EVENT: (data: WegasEvent) =>
    createAction(ActionType.EDITOR_EVENT, data),
  EDITOR_ADD_EVENT_HANDLER: (data: {
    id: string;
    type: keyof WegasEvents;
    cb: WegasEventHandler;
  }) => createAction(ActionType.EDITOR_ADD_EVENT_HANDLER, data),
  EDITOR_REMOVE_EVENT_HANDLER: (data: {
    id: string;
    type: WegasEvent['@class'];
  }) => createAction(ActionType.EDITOR_REMOVE_EVENT_HANDLER, data),
  EDITOR_SET_CLIENT_METHOD: (data: ClientMethodPayload) =>
    createAction(ActionType.EDITOR_SET_CLIENT_METHOD, data),
  EDITOR_REGISTER_SERVER_GLOBAL_METHOD: (data: ServerGlobalMethodPayload) =>
    createAction(ActionType.EDITOR_REGISTER_SERVER_GLOBAL_METHOD, data),
  EDITOR_REGISTER_SERVER_VARIABLE_METHOD: (data: ServerVariableMethodPayload) =>
    createAction(ActionType.EDITOR_REGISTER_SERVER_VARIABLE_METHOD, data),
  EDITOR_SET_VARIABLE_SCHEMA: (data: {
    name: string;
    schemaFN?: CustomSchemaFN;
    simpleFilter?: WegasClassNames;
  }) => createAction(ActionType.EDITOR_SET_VARIABLE_SCHEMA, data),
  EDITOR_REGISTER_PAGE_LOADER: (data: { name: string; pageId: IScript }) =>
    createAction(ActionType.EDITOR_REGISTER_PAGE_LOADER, data),
  EDITOR_RESET_PAGE_LOADER: () =>
    createAction(ActionType.EDITOR_RESET_PAGE_LOADER, {}),
  EDITOR_UNREGISTER_PAGE_LOADER: (data: { name: string }) =>
    createAction(ActionType.EDITOR_UNREGISTER_PAGE_LOADER, data),
  // EDITOR_SET_VARIABLE_METHOD: (data: ClientMethodPayload) =>
  // createAction(ActionType.EDITOR_SET_SERVER_METHOD, data),
  VARIABLE_EDIT: variableEditAction(ActionType.VARIABLE_EDIT),
  FSM_EDIT: variableEditAction(ActionType.FSM_EDIT),
  FILE_EDIT: (data: {
    entity: IAbstractContentDescriptor;
    cb?: (newEntity: IAbstractContentDescriptor) => void;
  }) => createAction(ActionType.FILE_EDIT, data),
  VARIABLE_CREATE: <T extends IAbstractEntity>(data: {
    '@class': IAbstractEntity['@class'];
    parentId?: number;
    parentType?: string;
    actions: {
      save?: (entity: T) => void;
      delete?: (entity: T) => void;
    };
  }) => createAction(ActionType.VARIABLE_CREATE, data),
  CLOSE_EDITOR: () => createAction(ActionType.CLOSE_EDITOR, {}),
  MANAGED_RESPONSE_ACTION: (data: {
    // Nearly empty shells
    deletedEntities: {
      [K in keyof NormalizedData]: { [id: string]: IAbstractEntity };
    };
    updatedEntities: NormalizedData;
    events: WegasEvent[];
  }) => createAction(ActionType.MANAGED_RESPONSE_ACTION, data),
  // PAGE_EDIT_MODE: (data: boolean) =>
  //   createAction(ActionType.PAGE_EDIT_MODE, data),
  // PAGE_LOAD_ID: (data?: string) => createAction(ActionType.PAGE_LOAD_ID, data),
  PAGE_INDEX: (data: { index: PageIndex }) =>
    createAction(ActionType.PAGE_INDEX, data),
  // PAGE_SRC_MODE: (data: boolean) =>
  //   createAction(ActionType.PAGE_SRC_MODE, data),
  // PAGE_EDIT: (data: { page: string; path: string[] }) =>
  //   createAction(ActionType.PAGE_EDIT, data),
  PAGE_FETCH: (data: { pages: Pages }) =>
    createAction(ActionType.PAGE_FETCH, data),
  PAGE_ERROR: (data: { error: string }) =>
    createAction(ActionType.PAGE_ERROR, data),
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
  TEAM_FETCH_ALL: (data: { teams: ITeam[] }) =>
    createAction(ActionType.TEAM_FETCH_ALL, data),
  TEAM_UPDATE: (data: { team: ITeam }) =>
    createAction(ActionType.TEAM_UPDATE, data),
  GAME_FETCH: (data: { game: IGame }) =>
    createAction(ActionType.GAME_FETCH, data),
  LOCK_SET: (data: { token: string; locked: boolean }) =>
    createAction(ActionType.LOCK_SET, data),
};

export type StateActions<
  A extends keyof typeof ActionCreator = keyof typeof ActionCreator
> = ReturnType<typeof ActionCreator[A]>;

// TOOLS

export const closeEditorWhenDeletedVariable = (
  deletedVariables: VariableDescriptorState,
  dispatch: StoreDispatch,
  editing?: Readonly<Edition>,
) =>
  editing &&
  'entity' in editing &&
  'id' in editing.entity &&
  Object.keys(deletedVariables).includes(String(editing.entity.id)) &&
  dispatch(closeEditor());

export function triggerEventHandlers(event: WegasEvent) {
  Object.values(store.getState().global.eventsHandlers[event['@class']]).map(
    handler => {
      handler(event);
    },
  );
}

export function manageResponseHandler(
  payload: IManagedResponse,
  localDispatch?: StoreDispatch,
  localState?: EditingState,
  selectUpdatedEntity: boolean = true,
) {
  const deletedEntities = normalizeDatas(payload.deletedEntities);
  if (localDispatch && localState) {
    closeEditorWhenDeletedVariable(
      deletedEntities.variableDescriptors,
      localDispatch,
      localState.editing,
    );
  }

  const updatedEntities = normalizeDatas(payload.updatedEntities);
  if (localState && localDispatch) {
    const editState = localState.editing;
    const currentEditingEntity =
      editState && 'entity' in editState && 'id' in editState.entity
        ? editState.entity
        : undefined;

    if (currentEditingEntity && currentEditingEntity.id !== undefined) {
      const updatedEntity =
        updatedEntities[
          discriminant(currentEditingEntity) as keyof NormalizedData
        ][currentEditingEntity.id];
      if (
        selectUpdatedEntity &&
        updatedEntity &&
        shallowDifferent(updatedEntity, currentEditingEntity)
      ) {
        getEntityActions(updatedEntity).then(
          ({ edit }) =>
            editState &&
            localDispatch(
              edit(
                updatedEntity,
                'path' in editState ? editState.path : undefined,
              ),
            ),
        );
      }
    }
  }

  const managedValuesOnly = {
    deletedEntities,
    updatedEntities,
    events: [],
  };

  const managedValues = {
    ...managedValuesOnly,
    events:
      payload.events?.map(event => {
        const timedEvent: WegasEvent = {
          ...event,
          timestamp: new Date().getTime(),
          unread: true,
        };
        triggerEventHandlers(timedEvent);

        return timedEvent;
      }) || [],
  };

  localDispatch &&
    localDispatch(ActionCreator.MANAGED_RESPONSE_ACTION(managedValues));

  return ActionCreator.MANAGED_RESPONSE_ACTION(managedValuesOnly);
}
