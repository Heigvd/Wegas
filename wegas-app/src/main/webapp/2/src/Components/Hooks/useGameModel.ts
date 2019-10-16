import { GameModel } from '../../data/selectors';
import { useStore } from '../../data/store';
import { shallowDifferent } from '../../data/connectStore';

/**
 * Hook, returns updated GameModel
 */
export function useGameModel() {
  return useStore(GameModel.selectCurrent, shallowDifferent);
}
