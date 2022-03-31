import {
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
import { Popup } from '../Components/PopupManager';
import { getEntityActions } from '../Editor/editionConfig';
import { ActionType, ActionTypeValues } from './actionTypes';
import { EditorLanguagesCode } from './i18n';
import { discriminant, normalizeDatas, NormalizedData } from './normalize';
import { closeEditor, EditingState, Edition } from './Reducer/editingState';
import { GlobalState, LoggerLevel, WegasStatus } from './Reducer/globalState';
import { VariableDescriptorState } from './Reducer/VariableDescriptorReducer';
import { EditingStoreDispatch } from './Stores/editingStore';
import { store } from './Stores/store';

function createAction<T extends ActionTypeValues, P>(type: T, payload: P) {
  return {
    type,
    payload,
  };
}

/**
 * Simple action creators.
 */
export const ActionCreator = {
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
  EDITOR_SET_LANGUAGE: (data: { language: EditorLanguagesCode }) =>
    createAction(ActionType.EDITOR_SET_LANGUAGE, data),
  EDITOR_SET_ROLES: (data: {
    roles: { [id: string]: Role };
    defaultRoleId: string;
    rolesId: string;
  }) => createAction(ActionType.EDITOR_SET_ROLES, data),
  EDITOR_ADD_EVENT_HANDLER: (data: {
    id: string;
    type: keyof WegasEvents;
    cb: WegasEventHandler;
  }) => createAction(ActionType.EDITOR_ADD_EVENT_HANDLER, data),
  EDITOR_REMOVE_EVENT_HANDLER: (data: {
    id: string;
    type: WegasEvent['@class'];
  }) => createAction(ActionType.EDITOR_REMOVE_EVENT_HANDLER, data),

  MANAGED_RESPONSE_ACTION: (data: {
    // Nearly empty shells
    deletedEntities: {
      [K in keyof NormalizedData]: { [id: string]: IAbstractEntity };
    };
    updatedEntities: NormalizedData;
    events: WegasEvent[];
  }) => createAction(ActionType.MANAGED_RESPONSE_ACTION, data),

  PAGE_INDEX: (data: { index: PageIndex }) =>
    createAction(ActionType.PAGE_INDEX, data),
  PAGE_FETCH: (data: { pages: Pages }) =>
    createAction(ActionType.PAGE_FETCH, data),
  PAGE_ERROR: (data: { error: string }) =>
    createAction(ActionType.PAGE_ERROR, data),

  SEARCH: (data: { searchString: string | undefined }) =>
    createAction(ActionType.SEARCH, data),
  SEARCH_DEEP: (data: { searchString: string | undefined }) =>
    createAction(ActionType.SEARCH_DEEP, data),
  SEARCH_SET_DEEP: (data: { deep: boolean }) =>
    createAction(ActionType.SEARCH_SET_DEEP, data),

  PUSHER_SOCKET: (data: { socket_id: string; status: string }) =>
    createAction(ActionType.PUSHER_SOCKET, data),

  SERVER_STATUS: (data: { status: WegasStatus }) =>
    createAction(ActionType.SERVER_STATUS, data),

  GAMEMODEL_EDIT: (data: { gameModel: IGameModel; gameModelId: string }) =>
    createAction(ActionType.GAMEMODEL_EDIT, data),

  GAMEMODEL_LANGUAGE_EDIT: (data: {
    gameModelLanguage: IGameModelLanguage;
    gameModelId: string;
  }) => createAction(ActionType.GAMEMODEL_LANGUAGE_EDIT, data),

  TEAM_FETCH_ALL: (data: { teams: ITeam[] }) =>
    createAction(ActionType.TEAM_FETCH_ALL, data),
  TEAM_UPDATE: (data: { team: ITeam }) =>
    createAction(ActionType.TEAM_UPDATE, data),

  GAME_FETCH: (data: { game: IGame }) =>
    createAction(ActionType.GAME_FETCH, data),

  LOCK_SET: (data: { token: string; locked: boolean }) =>
    createAction(ActionType.LOCK_SET, data),

  ADD_POPUP: (data: Popup & { id: string }) =>
    createAction(ActionType.ADD_POPUP, data),
  REMOVE_POPUP: (data: { id: string }) =>
    createAction(ActionType.REMOVE_POPUP, data),

  LANGUAGES_TRANSLATION_AVAILABLE: (data: {
    translatableLanguages: GlobalState['languages']['translatableLanguages'];
  }) => createAction(ActionType.LANGUAGES_TRANSLATION_AVAILABLE, data),
  LANGUAGES_EDITON_ALLOWED: (data: {
    editableLanguages: GlobalState['languages']['editableLanguages'];
  }) => createAction(ActionType.LANGUAGES_EDITON_ALLOWED, data),
  LOGGER_LEVEL_SET: (payload: { loggerName: string; level: LoggerLevel }) =>
    createAction(ActionType.LOGGER_LEVEL_SET, payload),
};

export type StateActions<
  A extends keyof typeof ActionCreator = keyof typeof ActionCreator,
> = ReturnType<typeof ActionCreator[A]>;

// TOOLS

export const closeEditorWhenDeletedVariable = (
  deletedVariables: VariableDescriptorState,
  dispatch: EditingStoreDispatch,
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
  localDispatch?: EditingStoreDispatch,
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

  store.dispatch(ActionCreator.MANAGED_RESPONSE_ACTION(managedValues));

  localDispatch &&
    localDispatch(ActionCreator.MANAGED_RESPONSE_ACTION(managedValues));

  return ActionCreator.MANAGED_RESPONSE_ACTION(
    localDispatch ? managedValuesOnly : managedValues,
  );
}
