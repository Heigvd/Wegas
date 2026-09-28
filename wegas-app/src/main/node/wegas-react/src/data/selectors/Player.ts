import { instantiate } from '../scriptable';
import { useAppSelector } from '../../store/hooks';
import { RootState, store } from '../../store/store';

/**
 * Get the player with id
 * @param id player's id
 */
export function select(id: number, state: RootState = store.getState()) {
  return state.players.entities[id];
}

/**
 * Get the current player.
 *
 * Dual-use: called with no argument it reads the store synchronously
 * (imperative, non-React callers); passed to useAppSelector it receives the
 * state and acts as a reactive selector.
 */
export function selectCurrent(state: RootState = store.getState()) {
  return state.players.entities[state.players.currentPlayerId];
}

export function useCurrentPlayer() {
  const player = useAppSelector(selectCurrent);
  return instantiate(player);
}

export function self() {
  return instantiate(selectCurrent());
}
