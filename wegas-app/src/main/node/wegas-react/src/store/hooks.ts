/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSelector } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';
import * as React from 'react';
import { shallowEqual, TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export { shallowEqual };

/**
 * Deep equality, for use as the 2nd argument of useAppSelector,
 * useDataSelector or usePageComponentStore.
 *
 * Equality functions return true when the values are EQUAL (skip the
 * re-render). Never pass a negated one (`(a, b) => !isEqual(a, b)`): the hook
 * would then keep a stale value whenever it changes.
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

/**
 * The slices that client scripts and the imperative data helpers (getInstance,
 * Player.self(), VariableDescriptor.select, scriptable getValue()...) read.
 * Stable reference until one of them changes.
 *
 * UI state (edition, pageEditor, search, popups...) is deliberately left out:
 * it changes on every hover or keystroke and no data read depends on it.
 */
export const selectDataVersion = createSelector(
    [
        (s: RootState) => s.user,
        (s: RootState) => s.players,
        (s: RootState) => s.teams,
        (s: RootState) => s.games,
        (s: RootState) => s.gameModels,
        (s: RootState) => s.variableDescriptors,
        (s: RootState) => s.variableInstances,
        (s: RootState) => s.pages,
        (s: RootState) => s.scriptRegistry,
    ],
    (...slices) => slices,
);

/**
 * Subscribe to a value computed through the imperative data helpers, which read
 * the store themselves instead of taking a state argument.
 *
 * `compute` runs again only when a data slice changes (see selectDataVersion)
 * or when `compute` itself changes, so it MUST be stable: wrap it in
 * useCallback / useMemo. The component re-renders only when the result changes
 * according to `isEqual` (default shallowEqual).
 *
 * `isEqual` returns true when the values are EQUAL (shallowEqual, deepEqual),
 * like useAppSelector's equality functions.
 *
 * Prefer a plain useAppSelector selector when the value can be read from its
 * state argument.
 */
export function useDataSelector<R>(
    compute: () => R,
    isEqual: (a: R, b: R) => boolean = shallowEqual,
): R {
    const selector = React.useMemo(
        // the cached result is returned for as long as the data version is unchanged
        () => createSelector([selectDataVersion], () => compute()),
        [compute],
    );
    return useAppSelector(selector, isEqual);
}
