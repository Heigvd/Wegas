/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { shallowEqual, TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, WegasLobbyState } from './store';

export { shallowEqual } from 'react-redux';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<WegasLobbyState> = useSelector;

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * kind of shallowEquals, but use shallowEqual to compare first-level-nested arrays
 */
export const customStateEquals = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a === 'object' && a != null && typeof b === 'object' && b != null) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    // TODO shouldn't sort occur after comparing keyset sizes ?
    if (aKeys.length !== bKeys.length) {
      // keysets mismatch
      return false;
    }

    for (const key in a) {
      if (hasOwn.call(b, key)) {
        if (key in a) { // TODO : by for loop construct, this is always true
          const aValue = (a as { [key: string]: unknown })[key];
          const bValue = (b as { [key: string]: unknown })[key];

          if (!Object.is(aValue, bValue)) {
            // values mismatch
            if (Array.isArray(aValue) && Array.isArray(bValue)) {
              // but values are arrays so they may match anyway
              if (!shallowEqual(aValue, bValue)) {
                // nope, array does not match
                return false;
              }
            } else {
              // not arrays => no match
              return false;
            }
          }
        }
      } else {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};
