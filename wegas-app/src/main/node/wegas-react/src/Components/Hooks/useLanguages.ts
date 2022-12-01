import { LanguagesAPI } from '../../API/languages.api';
import { ActionCreator } from '../../data/actions';
import { store, useStore } from '../../data/Stores/store';
import { deepDifferent } from './storeHookFactory';

export function useTranslatableLanguages() {
  const availableLanguages = useStore(
    s => s.global.languages.translatableLanguages,
    deepDifferent,
  );

  if (availableLanguages == null) {
    store.dispatch(
      ActionCreator.LANGUAGES_TRANSLATION_AVAILABLE({
        translatableLanguages: 'loading',
      }),
    );
    LanguagesAPI.getAvailableLanguages().then(res => {
      store.dispatch(
        ActionCreator.LANGUAGES_TRANSLATION_AVAILABLE({
          translatableLanguages: res,
        }),
      );
    });
  }

  return availableLanguages;
}

export function useEditableLanguages() {
  const editableLanguages = useStore(
    s => s.global.languages.editableLanguages,
    deepDifferent,
  );

  if (editableLanguages == null) {
    store.dispatch(
      ActionCreator.LANGUAGES_EDITON_ALLOWED({
        editableLanguages: 'loading',
      }),
    );
    LanguagesAPI.getEditableLanguages().then(res => {
      if (res.length === 1 && res[0] === '*') {
        store.dispatch(
          ActionCreator.LANGUAGES_EDITON_ALLOWED({
            editableLanguages: 'all',
          }),
        );
      } else {
        store.dispatch(
          ActionCreator.LANGUAGES_EDITON_ALLOWED({
            editableLanguages: res,
          }),
        );
      }
    });
  }
  return editableLanguages;
}
