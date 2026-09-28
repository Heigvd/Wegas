import global, { GlobalState } from './globalState';

export interface State {
  global: Readonly<GlobalState>;
}

export default {
  global,
};