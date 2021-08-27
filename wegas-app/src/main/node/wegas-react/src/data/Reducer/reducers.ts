import gameModels, { GameModelState } from './gameModel';
import variableInstances, {
  VariableInstanceState,
} from './VariableInstanceReducer';
import variableDescriptors, {
  VariableDescriptorState,
} from './VariableDescriptorReducer';
import global, { GlobalState } from './globalState';
import games, { GameState } from './game';
import pages from './pageState';
import players, { PlayerState } from './player';
import teams, { TeamState } from './teams';

export interface State {
  gameModels: Readonly<GameModelState>;
  games: Readonly<GameState>;
  variableDescriptors: Readonly<VariableDescriptorState>;
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
  players: Readonly<PlayerState>;
  teams: Readonly<TeamState>;
}

export default {
  gameModels,
  variableDescriptors,
  variableInstances,
  global,
  pages,
  games,
  players,
  teams,
};
