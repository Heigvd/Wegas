/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { isEqual } from 'lodash-es';
import { shallowEqual, TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export { shallowEqual };

/**
 * Deep equality, for use as useAppSelector's 2nd argument.
 *
 * NOTE the orientation: react-redux equality functions return true when the
 * values are EQUAL (skip the re-render). This is the opposite of the
 * `deepDifferent` / `shallowDifferent` predicates the old store's useStore
 * takes, so those must never be passed to useAppSelector.
 */
export const deepEqual = <T,>(a: T, b: T): boolean => isEqual(a, b);

// pre-typed hooks. Use these throughout the app instead of the bare
// react-redux useDispatch / useSelector.
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Shallow-equality variant that also compares first-level array values with
 * shallowEqual, so a selector that rebuilds an array of unchanged items does
 * not trigger a re-render. Pass it as the 2nd argument to useAppSelector:
 *   useAppSelector(selectSomething, customStateEquals)
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
