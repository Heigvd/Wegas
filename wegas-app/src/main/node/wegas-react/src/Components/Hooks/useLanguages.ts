import * as React from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  fetchEditableLanguages,
  fetchTranslatableLanguages,
  selectEditableLanguages,
  selectTranslatableLanguages,
} from '../../store/slices/languages';
import { dispatch } from '../../store/store';

/**
 * The languages known by Deepl, fetched on first use.
 */
export function useTranslatableLanguages() {
  const translatableLanguages = useAppSelector(selectTranslatableLanguages);

  React.useEffect(() => {
    if (translatableLanguages === undefined) {
      dispatch(fetchTranslatableLanguages());
    }
  }, [translatableLanguages]);

  return translatableLanguages;
}

/**
 * The languages the user is allowed to edit, fetched on first use.
 */
export function useEditableLanguages() {
  const editableLanguages = useAppSelector(selectEditableLanguages);

  React.useEffect(() => {
    if (editableLanguages === undefined) {
      dispatch(fetchEditableLanguages());
    }
  }, [editableLanguages]);

  return editableLanguages;
}