import { store, useStore } from '../Stores/store';

export function selectIsReadyForClientScript(): boolean {
  const { initStatuses } = store.getState();
  return (
    initStatuses.instances &&
    initStatuses.variables &&
    initStatuses.gameModel &&
    initStatuses.game &&
    initStatuses.teams
  );
}

/**
 * In order to execute clientScript properly, some slices must have been fully initialized.
 *
 * This hook indicates whether or not the store is ready for client scrip execution
 */
export function useIsReadyForClientScript(): boolean {
  return useStore(selectIsReadyForClientScript);
}

export function selectIsReadyForPageDisplay(): boolean {
  const { initStatuses } = store.getState();
  return initStatuses.pages && initStatuses.clientScriptsEvaluationDone;
}

/**
 * This hook indicates if pages are ready to be displayed.
 */
export function useIsReadyForPageDisplay(): boolean {
  return useStore(selectIsReadyForPageDisplay);
}
