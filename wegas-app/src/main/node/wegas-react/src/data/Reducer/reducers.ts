import global, { GlobalState } from './globalState';
import pages from './pageState';
import variableInstances, {
  VariableInstanceState,
} from './VariableInstanceReducer';

export interface State {
  variableInstances: Readonly<VariableInstanceState>;
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
}

export default {
  variableInstances,
  global,
  pages,
};
