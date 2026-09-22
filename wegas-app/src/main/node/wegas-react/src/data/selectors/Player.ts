import { instantiate } from '../scriptable';
import { store as oldStore, useStore } from '../Stores/store';
import { useAppSelector } from '../../store/hooks';
import { store } from '../../store/store';

/**
 * Get the player with id
 * @param id player's id
 */
export function select(id: number) {
  return store.getState().players[id];
}

export function selectCurrent() {
  const currentPlayerId = oldStore.getState().global.currentPlayerId;
  return store.getState().players[currentPlayerId];
}

export function useCurrentPlayer() {
  const currentPlayerId = useStore(state => state.global.currentPlayerId);
  const player = useAppSelector(state => state.players[currentPlayerId]);
  return instantiate(player);
}

export function self() {
  return instantiate(selectCurrent());
}
