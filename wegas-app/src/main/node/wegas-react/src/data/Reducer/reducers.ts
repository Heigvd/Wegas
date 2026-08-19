import games, { GameState } from './game';
import gameModels, { GameModelState } from './gameModel';
import global, { GlobalState } from './globalState';
import pages from './pageState';
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
}

export default {
  gameModels,
  variableDescriptors,
  variableInstances,
  global,
  pages,
  games,
};
