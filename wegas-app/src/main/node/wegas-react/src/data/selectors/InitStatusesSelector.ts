import { useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';

export function selectIsReadyForClientScript(state: RootState): boolean {
  const { initStatuses } = state;
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
  return useAppSelector(selectIsReadyForClientScript);
}

export function selectIsReadyForPageDisplay(state: RootState): boolean {
  const { initStatuses } = state;
  return initStatuses.pages && initStatuses.clientScriptsEvaluationDone && initStatuses.components;
}

/**
 * This hook indicates if pages are ready to be displayed.
 */
export function useIsReadyForPageDisplay(): boolean {
  return useAppSelector(selectIsReadyForPageDisplay);
}
