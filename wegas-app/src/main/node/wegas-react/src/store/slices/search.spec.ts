/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from '../store';
import reducer, {
  clearSearch,
  searchDeep,
  SearchState,
  selectSearch,
  setSearchDeep,
  setSearchValue,
} from './search';

/**
 * `RootState` is imported as a *type only*, so this spec never loads the store
 * module (and none of the app it drags in). The cast is the price.
 */
const wrap = (search: SearchState) => ({ search } as unknown as RootState);

const initial = () => reducer(undefined, { type: 'unrelated/action' });

describe('search slice', () => {
  it('starts with no search, not deep', () => {
    expect(selectSearch(wrap(initial()))).toEqual({
      value: undefined,
      deep: false,
    });
  });

  it('sets and clears the value without touching deep', () => {
    const deep = reducer(initial(), setSearchDeep(true));

    const searching = reducer(deep, setSearchValue('score'));
    expect(searching).toEqual({ value: 'score', deep: true });

    const cleared = reducer(searching, clearSearch());
    expect(cleared).toEqual({ value: undefined, deep: true });
  });

  it('searchDeep sets the value and turns deep on', () => {
    expect(reducer(initial(), searchDeep('score'))).toEqual({
      value: 'score',
      deep: true,
    });
  });

  it('toggles deep without touching the value', () => {
    const s = reducer(reducer(initial(), searchDeep('score')), setSearchDeep(false));
    expect(s).toEqual({ value: 'score', deep: false });
  });

  it('keeps the same reference on an unrelated action', () => {
    const s = initial();
    expect(reducer(s, { type: 'unrelated/action' })).toBe(s);
  });
});