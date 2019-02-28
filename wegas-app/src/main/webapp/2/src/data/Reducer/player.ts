import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions } from '../actions';
import { omit } from 'lodash-es';

export interface PlayerState {
  [id: string]: Readonly<IPlayer>;
}
/**
 * Reducer for Players
 */
const players: Reducer<Readonly<PlayerState>> = u<PlayerState, [StateActions]>(
  (state: PlayerState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_MODE:
        const players = action.payload.updatedEntities.players;
        const deletedKeys = Object.keys(action.payload.deletedEntities.players);
        return { ...omit(state, deletedKeys), ...players };
    }
    return state;
  },
  CurrentGame.teams.reduce(
    (prev, t) => {
      t.players.forEach(p => (prev[p.id!] = p));
      return prev;
    },
    {} as PlayerState,
  ),
);
export default players;
