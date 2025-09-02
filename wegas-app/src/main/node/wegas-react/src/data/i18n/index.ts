import { Player, GameModel } from '../selectors';
import { ITranslatableContent, STranslatableContent } from 'wegas-ts-api';
import { entityIs } from '../entities';

export const editorLanguages = {
  EN: 'english',
  FR: 'français',
  IT: 'italiano',
  DE: 'deutsch',
};

export type EditorLanguages = typeof editorLanguages;
export type EditorLanguagesCode = keyof EditorLanguages;

export const EditorLanguageData = `EditorLanguageData.${ CurrentGM.id }`;

export function getSavedLanguage() {
  return window.localStorage.getItem(
    `EditorLanguageData.${ CurrentGM.id }`, // FIX : it does not work if we use the EditorLanguageData const
  ) as null | EditorLanguagesCode;
}

export function getUserLanguage(): EditorLanguagesCode {
  const wegasConfig = window.localStorage.getItem(`wegas-config`);
  if (wegasConfig == null) return 'EN';
  else
    return String(
      JSON.parse(wegasConfig).commons.language,
    ).toUpperCase() as EditorLanguagesCode;
}

export function createTranslation(lang: string, value?: string): ITranslation {
  return {
    '@class': 'Translation',
    lang: lang,
    status: '',
    translation: value === undefined ? '' : value,
  };
}

export function createTranslatableContent(
  lang?: string,
  value?: string,
  oldTranlatable?: ITranslatableContent | null,
): ITranslatableContent {
  return {
    '@class': 'TranslatableContent',
    translations: {
      ...oldTranlatable?.translations,
      ...(lang === undefined
        ? {
          DEF: createTranslation('DEF', value),
        }
        : {
          [lang]: createTranslation(lang, value),
        }),
    },
    version: 0,
  };
}

export function unsafeTranslate(
  translatable: ITranslatableContent | STranslatableContent | undefined | null,
  lang: string,
) {
  let translations: { [lang: string]: ITranslation };
  if (!translatable) {
    return undefined;
  }

  // récupère les translations sous forme de ITranslation
  if ('translations' in translatable) {
    translations = translatable.translations;
  } else {
    translations = Object.entries(translatable.getTranslations()).reduce(
      (o, t) => ({ ...o, [t[0]]: t[1].getEntity() }),
      {},
    );
  }
  const translation = translations[lang];

  if (Object.keys(translations).length === 0) {
    return undefined;
  } else if (translation === undefined) {
    return undefined;
  } else {
    return translation.translation;
  }
}

/**
 * Get all languages defined in the gameModel.
 * Active languages first, inactives afterwards.
 * Except for that, intial order is respected.
 */
export function orderGameModelLanguages(langs: IGameModelLanguage[]): IGameModelLanguage[] {
  const separated = langs.reduce<{ actives: IGameModelLanguage[], inactives: IGameModelLanguage[] }>((acc, cur) => {

    if (cur.active) {
      acc.actives.push(cur);
    } else {
      acc.inactives.push(cur);
    }

    return acc;
  }, {
    actives: [],
    inactives: [],
  });

  return [...separated.actives, ...separated.inactives];
}

/**
 * According to requested language, returns the most relevant translation found within the given translatable content.
 * If the language is not given, we use the Player language.
 */
export function translate(
  translatable: ITranslatableContent | STranslatableContent | undefined | null,
  langArg?: string,
  availableLanguagesArg?: IGameModelLanguage[],
): string {
  if (!translatable) {
    return '';
  }

  const lang = langArg ? langArg : Player.selectCurrent().lang;

  const availableLanguages = availableLanguagesArg
    ? availableLanguagesArg
    : orderGameModelLanguages(GameModel.selectCurrent().languages);

  // Make sure to have a map of ITranslation
  const translations =
    translatable instanceof STranslatableContent
      ? translatable.getEntity().translations
      : entityIs(translatable, 'TranslatableContent')
        ? translatable.translations
        : {};

  // List of code, ordered by languages ''importance''
  const languages =
    availableLanguages.length > 0
      ? availableLanguages.map(gml => gml.code) // prefer globally defined language list
      : Object.keys(translations); // but if it's empty, use in-content languages

  // move requested language at first position
  const langIndex = languages.indexOf(lang);
  if (langIndex >= 0) {
    languages.splice(langIndex, 1);
    languages.unshift(lang);
  }

  // find the first language code of first non-empty translation
  const codeToUse = languages.find(
    code => code in translations && translations[code].translation,
  );

  // return found translation or empty string
  return codeToUse ? translations[codeToUse].translation : '';
}
