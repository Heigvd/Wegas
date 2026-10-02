import { IAbstractEntity } from 'wegas-ts-api';
import { IManagedResponse } from '../API/rest';
import { shallowDifferent } from '../Components/Hooks/storeHookFactory';
import { getEntityActions } from '../Editor/editionConfig';
import { ActionType, ActionTypeValues } from './actionTypes';
import { discriminant, normalizeData, NormalizedData } from './normalize';
import { closeEditor } from './Reducer/editingState';
import { triggerEventHandlers } from '../Helper/eventHandlers';
import { VariableDescriptorState } from '../store/slices/variableDescriptors';
import { store } from './Stores/store';
import { AppDispatch, dispatch } from '../store/store';
import { Edition } from '../store/slices/edition';
import { updatePlayers } from '../store/slices/players';
import { updateTeams } from '../store/slices/teams';
import { managedResponseReceived } from '../store/actions';

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
  MANAGED_RESPONSE_ACTION: (data: {
    // Nearly empty shells
    deletedEntities: {
      [K in keyof NormalizedData]: { [id: string]: IAbstractEntity };
    };
    updatedEntities: NormalizedData;
    events: WegasEvent[];
  }) => createAction(ActionType.MANAGED_RESPONSE_ACTION, data),

  /**
   * TEMPORARY bridge, removed with the old store (Phase 5): only wakes up the
   * old store's `useStore` subscribers when the react-redux scriptRegistry
   * slice changes. See data/Stores/store.ts.
   */
  SCRIPT_REGISTRY_CHANGED: () =>
    createAction(ActionType.SCRIPT_REGISTRY_CHANGED, {}),
};

export type StateActions<
  A extends keyof typeof ActionCreator = keyof typeof ActionCreator,
> = ReturnType<typeof ActionCreator[A]>;

// TOOLS

export const closeEditorWhenDeletedVariable = (
  deletedVariables: VariableDescriptorState,
  dispatch: AppDispatch,
  editing?: Readonly<Edition>,
) =>
  editing &&
  'entity' in editing &&
  'id' in editing.entity &&
  Object.keys(deletedVariables).includes(String(editing.entity.id)) &&
  dispatch(closeEditor());

export function manageResponseHandler(
  payload: IManagedResponse,
  /**
   * Dispatch of the edition scope the caller belongs to: the app dispatch for
   * the main editor, a nested form's own dispatch when one is active. Omitted
   * when the caller has no edition to reconcile.
   */
  localDispatch?: AppDispatch,
  /** That scope's current edition, i.e. selectEdition(getState()). */
  localEditing?: Edition,
  selectUpdatedEntity: boolean = true,
  selectPath?: (string | number)[],
) {
  const deletedEntities = normalizeData(payload.deletedEntities);
  const updatedEntities = normalizeData(payload.updatedEntities);

  if (localDispatch) {
    closeEditorWhenDeletedVariable(
      deletedEntities.variableDescriptors,
      localDispatch,
      localEditing,
    );

    const currentEditingEntity =
      localEditing && 'entity' in localEditing && 'id' in localEditing.entity
        ? localEditing.entity
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
        const { edit } = getEntityActions(updatedEntity);
        const newPath =
          selectPath ??
          (localEditing && 'path' in localEditing
            ? localEditing.path
            : undefined);
        localDispatch(edit(updatedEntity, newPath));
      }
    }
  }

  const managedValuesOnly = {
    deletedEntities,
    updatedEntities,
    events: [] as WegasEvent[],
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

  // The new store MUST be updated before the old one. Redux notifies subscribers
  // synchronously, and old-store `useStore` selectors read migrated slices
  // (instances, players, teams...) straight from the new store. Dispatching to the
  // old store first would let those selectors latch a one-tick-stale value with
  // nothing left to re-notify them.
  dispatch(
    updatePlayers({
      updated: updatedEntities.players,
      deleted: Object.keys(deletedEntities.players),
    }),
  );

  dispatch(
    updateTeams({
      updated: updatedEntities.teams,
      deleted: Object.keys(deletedEntities.teams),
    }),
  );

  // new store: entity slices (games, gameModels, variableDescriptors,
  // variableInstances...), plus the editorEvents slice which owns the events
  dispatch(managedResponseReceived(managedValues));

  // old store: global
  store.dispatch(ActionCreator.MANAGED_RESPONSE_ACTION(managedValues));

  // The events are already in the editorEvents slice, so the action returned for
  // old-store callers never carries them. The local edition scope gets no
  // MANAGED_RESPONSE_ACTION either: it holds only an edition, and would ignore it.
  return ActionCreator.MANAGED_RESPONSE_ACTION(managedValuesOnly);
}
