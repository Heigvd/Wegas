import { GameModel } from '../../data/selectors';
import { useAppSelector } from '../../store/hooks';

/**
 * Hook, returns the current GameModel and re-renders when it changes.
 */
export function useGameModel() {
  return useAppSelector(GameModel.selectCurrent);
}
