/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { configureStore } from '@reduxjs/toolkit';

// Both modules pull the whole app (and server-injected globals) at import time.
jest.mock('../../API/languages.api', () => ({
  LanguagesAPI: {
    getAvailableLanguages: jest.fn(),
    getEditableLanguages: jest.fn(),
  },
}));
jest.mock('../../data/i18n', () => ({
  EditorLanguageData: 'EditorLanguageData.1',
  getSavedLanguage: jest.fn(() => null),
  getUserLanguage: jest.fn(() => 'FR'),
}));

import { LanguagesAPI } from '../../API/languages.api';
import { getSavedLanguage } from '../../data/i18n';
import reducer, {
  editorLanguageChanged,
  fetchEditableLanguages,
  fetchTranslatableLanguages,
} from './languages';

const api = LanguagesAPI as jest.Mocked<typeof LanguagesAPI>;

/** A store holding only this slice, under its real key, so thunk conditions work. */
const makeStore = () => configureStore({ reducer: { languages: reducer } });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('languages slice', () => {
  it('starts from the user language when nothing is saved', () => {
    const s = reducer(undefined, { type: 'unrelated/action' });

    expect(s).toEqual({
      currentEditorLanguageCode: 'FR',
      translatableLanguages: undefined,
      editableLanguages: undefined,
    });
  });

  it('prefers the language saved for this game model', () => {
    (getSavedLanguage as jest.Mock).mockReturnValueOnce('DE');

    const s = reducer(undefined, { type: 'unrelated/action' });

    expect(s.currentEditorLanguageCode).toBe('DE');
  });

  it('changes the editor language', () => {
    const s = reducer(undefined, editorLanguageChanged('IT'));

    expect(s.currentEditorLanguageCode).toBe('IT');
  });

  it('fetches the translatable languages once, even when asked twice', async () => {
    api.getAvailableLanguages.mockResolvedValue(['EN', 'FR']);
    const store = makeStore();

    const first = store.dispatch(fetchTranslatableLanguages());
    expect(store.getState().languages.translatableLanguages).toBe('loading');
    const second = store.dispatch(fetchTranslatableLanguages());
    await Promise.all([first, second]);

    expect(api.getAvailableLanguages).toHaveBeenCalledTimes(1);
    expect(store.getState().languages.translatableLanguages).toEqual([
      'EN',
      'FR',
    ]);
  });

  it('maps ["*"] editable languages to "all"', async () => {
    api.getEditableLanguages.mockResolvedValue(['*']);
    const store = makeStore();

    await store.dispatch(fetchEditableLanguages());

    expect(store.getState().languages.editableLanguages).toBe('all');
  });

  it('keeps an explicit list of editable languages', async () => {
    api.getEditableLanguages.mockResolvedValue(['EN', 'DE']);
    const store = makeStore();

    await store.dispatch(fetchEditableLanguages());

    expect(store.getState().languages.editableLanguages).toEqual(['EN', 'DE']);
  });

  it('stays "loading" when the request fails, so it is not retried', async () => {
    api.getEditableLanguages.mockRejectedValue(new Error('500'));
    const store = makeStore();

    await store.dispatch(fetchEditableLanguages());
    await store.dispatch(fetchEditableLanguages());

    expect(api.getEditableLanguages).toHaveBeenCalledTimes(1);
    expect(store.getState().languages.editableLanguages).toBe('loading');
  });
});