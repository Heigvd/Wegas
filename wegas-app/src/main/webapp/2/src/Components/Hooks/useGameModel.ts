import { GameModel } from '../../data/selectors';
import { useStore } from '../../data/store';

/**
 * Hook, returns updated GameModel
 */
export function useGameModel() {
  return useStore(GameModel.selectCurrent);
}
