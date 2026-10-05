import { IManagedResponse } from '../API/rest';
import { shallowDifferent } from '../Components/Hooks/storeHookFactory';
import { getEntityActions } from '../Editor/editionConfig';
import { discriminant, normalizeData, NormalizedData } from './normalize';
import { closeEditor } from './Reducer/editingState';
import { triggerEventHandlers } from '../Helper/eventHandlers';
import { VariableDescriptorState } from '../store/slices/variableDescriptors';
import { AppDispatch, dispatch } from '../store/store';
import { Edition } from '../store/slices/edition';
import { updatePlayers } from '../store/slices/players';
import { updateTeams } from '../store/slices/teams';
import { managedResponseReceived } from '../store/actions';

/**
 * What manageResponseHandler returns. No reducer handles it: the response has
 * already been applied to the store when it is returned. It only exists so the
 * `dispatch(manageResponseHandler(...))` call sites keep working.
 * TODO return void and unwrap those call sites (editing doc follow-up #14).
 */
export interface ManagedResponseHandledAction {
  type: 'managedResponse/handled';
}

const managedResponseHandled: ManagedResponseHandledAction = {
  type: 'managedResponse/handled',
};

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

  const managedValues = {
    deletedEntities,
    updatedEntities,
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

  // entity slices (games, gameModels, variableDescriptors, variableInstances...),
  // plus the editorEvents slice which owns the events
  dispatch(managedResponseReceived(managedValues));

  return managedResponseHandled;
}
