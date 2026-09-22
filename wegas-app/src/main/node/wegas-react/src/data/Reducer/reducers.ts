import global, { GlobalState } from './globalState';
import pages from './pageState';

export interface State {
  global: Readonly<GlobalState>;
  pages: Readonly<AllPages>;
}

export default {
  global,
  pages,
};