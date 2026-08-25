import global, { GlobalState } from './globalState';
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
  variableDescriptors: Readonly<VariableDescriptorState>;
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
  players: Readonly<PlayerState>;
  teams: Readonly<TeamState>;
}

export default {
  variableDescriptors,
  variableInstances,
  global,
  pages,
  players,
  teams,
};
