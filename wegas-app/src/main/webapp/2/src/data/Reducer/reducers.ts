import gameModels, { GameModelState } from './gameModel';
import variableDescriptors, {
  VariableDescriptorState,
} from './variableDescriptor';
import variableInstances, { VariableInstanceState } from './variableInstance';
import global, { GlobalState } from './globalState';
import pages, { PageState } from './pageState';

export interface State {
  gameModels: Readonly<GameModelState>;
  variableDescriptors: Readonly<VariableDescriptorState>;
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<PageState>;
}

export default {
  gameModels,
  variableDescriptors,
  variableInstances,
  global,
  pages,
};
