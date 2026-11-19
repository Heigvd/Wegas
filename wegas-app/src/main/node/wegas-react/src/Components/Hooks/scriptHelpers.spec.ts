/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import {
  GlobalsInputs,
  isEmptyScriptItem,
  sameGlobalsInputs,
} from './scriptHelpers';

describe('isEmptyScriptItem', () => {
  it('treats a missing script and an empty one as nothing to run', () => {
    expect(isEmptyScriptItem(undefined)).toBe(true);
    expect(isEmptyScriptItem(null)).toBe(true);
    expect(isEmptyScriptItem('')).toBe(true);
    expect(
      isEmptyScriptItem({
        '@class': 'Script',
        language: 'TypeScript',
        content: '',
      }),
    ).toBe(true);
  });

  it('treats a script with content as something to run', () => {
    expect(isEmptyScriptItem('1 + 1')).toBe(false);
    expect(
      isEmptyScriptItem({
        '@class': 'Script',
        language: 'TypeScript',
        content: 'x',
      }),
    ).toBe(false);
  });
});

describe('sameGlobalsInputs', () => {
  const contexts = {
    lang: 'en',
    selectLang: () => undefined,
    currentFeatures: {},
    classes: {},
  };
  const inputs = (overrides: Partial<GlobalsInputs> = {}): GlobalsInputs => ({
    globalContexts: contexts,
    dataVersion: ['data'],
    ...overrides,
  });

  it('is false before anything was written', () => {
    expect(sameGlobalsInputs(undefined, inputs())).toBe(false);
  });

  it('is true for the same data version and equal contexts, even as new objects', () => {
    const dataVersion = ['data'];
    const previous = inputs({ dataVersion });
    expect(
      sameGlobalsInputs(
        previous,
        inputs({ globalContexts: { ...contexts }, dataVersion }),
      ),
    ).toBe(true);
  });

  it('is false when the data version changed', () => {
    expect(
      sameGlobalsInputs(inputs(), inputs({ dataVersion: ['other'] })),
    ).toBe(false);
  });

  it('is false when a context value changed', () => {
    expect(
      sameGlobalsInputs(
        inputs(),
        inputs({ globalContexts: { ...contexts, lang: 'fr' } }),
      ),
    ).toBe(false);
  });
});
