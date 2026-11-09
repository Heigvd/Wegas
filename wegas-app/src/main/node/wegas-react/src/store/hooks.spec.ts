/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from './store';
import { selectDataVersion } from './hooks';

/**
 * Only the slices selectDataVersion reads, plus UI slices it must ignore.
 * `RootState` is imported as a *type only*, so this spec never loads the store.
 */
const makeState = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    user: {},
    players: {},
    teams: {},
    games: {},
    gameModels: {},
    variableDescriptors: {},
    variableInstances: {},
    pages: {},
    scriptRegistry: {},
    edition: {},
    pageEditor: {},
    search: {},
    ...overrides,
  } as unknown as RootState);

describe('selectDataVersion', () => {
  it('keeps its reference while no data slice changes', () => {
    const state = makeState();
    const version = selectDataVersion(state);

    // UI-only changes: new edition / pageEditor / search objects
    const uiChanged = {
      ...state,
      edition: {},
      pageEditor: {},
      search: { value: 'x' },
    } as RootState;

    expect(selectDataVersion(uiChanged)).toBe(version);
  });

  it.each([
    'user',
    'players',
    'teams',
    'games',
    'gameModels',
    'variableDescriptors',
    'variableInstances',
    'pages',
    'scriptRegistry',
  ])('changes when %s changes', slice => {
    const state = makeState();
    const version = selectDataVersion(state);

    const changed = { ...state, [slice]: {} } as RootState;

    expect(selectDataVersion(changed)).not.toBe(version);
  });
});