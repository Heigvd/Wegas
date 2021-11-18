/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

//import {isEqual} from 'lodash';
import * as React from 'react';

const localStorageKey = 'wegas_common';

function getKey(key: string) {
  return `${localStorageKey}.${key}`;
}

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (newValue: T) => void] {
  const getValue = React.useCallback(() => {
    const value = window.localStorage.getItem(getKey(key));
    return value != null ? (JSON.parse(value) as T) : defaultValue;
  }, [key, defaultValue]);

  const [value, setValue] = React.useState(getValue);

  React.useEffect(() => {
    window.localStorage.setItem(getKey(key), JSON.stringify(value));
  }, [key, value]);

  // uncomment next lines to enable cross-tabs sync:
  //
  //  const onChange = React.useCallback(() => {
  //    const v = getValue();
  //    if (!isEqual(v, value)) {
  //      setValue(v);
  //    }
  //  }, [getValue, value]);
  //
  //  React.useEffect(() => {
  //    const cb = onChange;
  //    window.addEventListener('storage', cb);
  //    return () => {
  //      window.removeEventListener('storage', cb);
  //    };
  //  }, [onChange])
  //
  return [value, setValue];
}
