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
export const customStateEquals = <T,>(a: T, b: T): boolean => {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a === 'object' && a != null && typeof b === 'object' && b != null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key in a) {
      if (hasOwn.call(b, key)) {
        const aValue = a[key];
        const bValue = b[key];

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

    }
    return true;
  } else {
    return false;
  }
};
