import { selectCurrentGameModel } from '../../store/slices/gameModel';
import { useAppSelector } from '../../store/hooks';

/**
 * Hook, returns the current GameModel and re-renders when it changes.
 */
export function useGameModel() {
  return useAppSelector(selectCurrentGameModel);
}
