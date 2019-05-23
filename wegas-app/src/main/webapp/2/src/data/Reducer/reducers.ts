import { Immutable } from 'immer';
import games, { GameState } from './game';
import gameModels, { GameModelState } from './gameModel';
import global, { GlobalState } from './globalState';
import pages, { PageState } from './pageState';
import players, { PlayerState } from './player';
import teams, { TeamState } from './teams';
import variableDescriptors, { VariableDescriptorState } from './variableDescriptor';
import variableInstances, { VariableInstanceState } from './variableInstance';

export interface State {
  gameModels: Immutable<GameModelState>;
  games: Immutable<GameState>;
  variableDescriptors: Immutable<VariableDescriptorState>;
  variableInstances: Immutable<VariableInstanceState>;
  global: Immutable<GlobalState>;
  pages: Immutable<PageState>;
  players: Immutable<PlayerState>;
  teams: Immutable<TeamState>;
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
