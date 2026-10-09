import { IManagedResponse } from '../API/rest';
import { shallowIs } from '../Helper/shallowIs';
import { getEntityActions } from '../Editor/editionConfig';
import { discriminant, normalizeData, NormalizedData } from '../data/normalize';
import { closeEditor, Edition } from './slices/edition';
import { triggerEventHandlers } from '../Helper/eventHandlers';
import { VariableDescriptorState } from './slices/variableDescriptors';
import { AppDispatch, dispatch } from './store';
import { updatePlayers } from './slices/players';
import { updateTeams } from './slices/teams';
import { managedResponseReceived } from './actions';

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

/**
 * Apply a managed-mode response (REST or websocket) to the store: update the
 * entity slices, log its events, and reconcile the caller's edition scope.
 *
 * Call it directly, it dispatches everything itself: there is nothing to
 * dispatch with its result.
 */
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
): void {
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
        !shallowIs(updatedEntity, currentEditingEntity)
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
}
