import global, { GlobalState } from './globalState';
import pages from './pageState';
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
}

export default {
  variableDescriptors,
  variableInstances,
  global,
  pages,
};
