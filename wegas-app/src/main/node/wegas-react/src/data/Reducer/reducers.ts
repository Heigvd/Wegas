import global, { GlobalState } from './globalState';
import pages from './pageState';
import variableDescriptors, {
  VariableDescriptorState,
} from './VariableDescriptorReducer';

export interface State {
  variableDescriptors: Readonly<VariableDescriptorState>;
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
}

export default {
  variableDescriptors,
  global,
  pages,
};
