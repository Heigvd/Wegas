import { EditorLanguagesCode } from '../data/i18n';
import { selectCurrentEditorLanguage } from '../data/selectors/Languages';
import { useStore } from '../data/Stores/store';

export function internalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
  lang?: EditorLanguagesCode,
): Translations {
  let language: string | undefined = lang;

  if (language == null) {
    if (translatableObject['EN'] != null) {
      language = 'EN';
    } else if (Object.keys(translatableObject)[0] != null) {
      language = Object.keys(translatableObject)[0];
    }
  }
  if (language == null) {
    throw Error('No translation found');
  } else {
    return translatableObject[language];
  }
}

export function useInternalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
): Translations {
  const lang = useStore(selectCurrentEditorLanguage);
  return internalTranslate(translatableObject, lang);
}
