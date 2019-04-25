import gameModels, { GameModelState } from './gameModel';
import variableDescriptors, {
  VariableDescriptorState,
} from './variableDescriptor';
import variableInstances, { VariableInstanceState } from './variableInstance';
import global, { GlobalState } from './globalState';
import pages, { PageState } from './pageState';
import games, { GameState } from './game';
import players, { PlayerState } from './player';
import teams, { TeamState } from './teams';
import libraries, { LibraryState } from './libraryState';

export interface State {
  gameModels: Readonly<GameModelState>;
  games: Readonly<GameState>;
  variableDescriptors: Readonly<VariableDescriptorState>;
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<PageState>;
  players: Readonly<PlayerState>;
  teams: Readonly<TeamState>;
  libraries: Readonly<LibraryState>;
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
  libraries,
};
