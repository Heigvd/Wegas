import { EditorLanguagesCode } from '../data/i18n';
import { useStore } from '../data/Stores/store';

export function internalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
  lang?: EditorLanguagesCode,
): Translations {
  return (
    (lang && translatableObject[lang]) ||
    translatableObject['EN'] ||
    translatableObject[Object.keys(translatableObject)[0]]
  );
}

export function useInternalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
): Translations {
  const lang = useStore(s => s.global.currentEditorLanguageCode);
  return internalTranslate(translatableObject, lang);
}
