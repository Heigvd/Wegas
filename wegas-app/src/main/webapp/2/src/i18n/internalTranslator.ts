import * as React from 'react';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';

export interface TranslatableObject<T> {
  [lang: string]: T;
}

export function internalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
  lang?: string,
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
  const { lang } = React.useContext(languagesCTX);
  return internalTranslate(translatableObject, lang);
}
