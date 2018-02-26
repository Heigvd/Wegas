declare module 'lodash/fp' {
  import * as _ from 'lodash';

  interface Static {
    unset<T, U extends T>(path: _.PropertyPath, object: T): U;
    set<T, U, V extends T>(path: _.PropertyPath, value: U, object: T): V;
    get<T>(path: _.PropertyPath, object: T): any;
  }
  const fp: Static;
  export = fp;
}
