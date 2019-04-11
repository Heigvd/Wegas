import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions } from '../actions';
import { omit } from 'lodash-es';

export interface TeamState {
  [id: string]: Readonly<ITeam>;
}
/**
 * Reducer for Teams
 */
const teams: Reducer<Readonly<TeamState>> = u(
  (state: TeamState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_MODE: {
        const teams = action.payload.updatedEntities.teams;
        const deletedKeys = Object.keys(action.payload.deletedEntities.teams);
        return { ...omit(state, deletedKeys), ...teams };
      }
    }
    return state;
  },
  CurrentGame.teams.reduce(
    (prev, t) => {
      prev[t.id!] = t;
      return prev;
    },
    {} as TeamState,
  ),
);
export default teams;
