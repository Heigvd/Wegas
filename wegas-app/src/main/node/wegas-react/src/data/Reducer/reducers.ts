import games, { GameState } from './game';
import gameModels, { GameModelState } from './gameModel';
import global, { GlobalState } from './globalState';
import initStatuses, { InitState } from './initState';
import pages from './pageState';
import players, { PlayerState } from './player';
import teams, { TeamState } from './teams';
import variableDescriptors, {
  VariableDescriptorState,
} from './VariableDescriptorReducer';
import variableInstances, {
  VariableInstanceState,
} from './VariableInstanceReducer';

export interface State {
  gameModels: Readonly<GameModelState>;
  games: Readonly<GameState>;
  variableDescriptors: Readonly<VariableDescriptorState>;
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
  players: Readonly<PlayerState>;
  teams: Readonly<TeamState>;
  initStatuses: Readonly<InitState>;
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
  initStatuses,
};
