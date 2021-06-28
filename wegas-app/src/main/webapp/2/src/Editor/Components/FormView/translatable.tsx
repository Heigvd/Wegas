import * as React from 'react';
import { Schema } from 'jsoninput';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { entityIs } from '../../../data/entities';
import { LabeledView } from './labeled';
import {
  ITranslatableContent,
  ITranslation,
  STranslatableContent,
} from 'wegas-ts-api';

interface TranslatableProps {
  value?: ITranslatableContent;
  onChange: (value: ITranslatableContent) => void;
  view: Schema['view'] & { label?: React.ReactNode };
}

interface EndProps {
  value?: string | number;
  onChange: (value: string) => void;
  view: LabeledView;
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
): ITranslatableContent {
  return {
    '@class': 'TranslatableContent',
    translations:
      lang === undefined
        ? {
            DEF: createTranslation('DEF', value),
          }
        : {
            [lang]: createTranslation(lang, value),
          },
    version: 0,
  };
}

export function useTranslate(
  translatable?: ITranslatableContent | STranslatableContent | null,
) {
  const { lang, availableLang } = React.useContext(languagesCTX);
  return translatable ? translate(translatable, lang, availableLang) : '';
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
 * According to requested language, returns the most relevant translation found within the given translatable content
 */
export function translate(
  translatable: ITranslatableContent | STranslatableContent | undefined | null,
  lang: string,
  availableLanguages: IGameModelLanguage[] = [],
): string {
  if (!translatable) {
    return '';
  }

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

/**
 * HOC: Transform a hashmap (lang:value) into value based on current language
 * @param Comp
 */
export default function translatable<P extends EndProps>(
  Comp: React.ComponentType<P>,
) {
  function Translated(
    props: TranslatableProps & Omit<P, 'value' | 'onChange'>,
  ) {
    const { lang, availableLang } = React.useContext(languagesCTX);
    const [currentLanguage, setCurrentLanguage] = React.useState<string>(lang);

    React.useEffect(() => {
      setCurrentLanguage(lang);
    }, [lang]);

    const view = React.useMemo(
      () => ({
        ...props.view,
        label: <span>{`${props.view.label}`}</span>,
        onLanguage: setCurrentLanguage,
        currentLanguage,
      }),
      [props.view, currentLanguage],
    );

    const pvalue: ITranslatableContent =
      typeof props.value === 'object' &&
      entityIs(props.value, 'TranslatableContent')
        ? props.value
        : createTranslatableContent(
            currentLanguage,
            typeof props.value === 'string'
              ? props.value
              : JSON.stringify(props.value),
          );

    const currTranslation = pvalue.translations[currentLanguage];

    if ((view as any).readOnly) {
      // variable is protected by the model
      const theLanguage = availableLang.find(al => al.code === currentLanguage);
      if (theLanguage != null && theLanguage.visibility === 'PRIVATE') {
        // but this language is not defined by the model
        if (
          Object.entries(pvalue.translations).find(([key, value]) => {
            const lang = availableLang.find(al => al.code === key);
            return lang && lang.visibility != 'PRIVATE' && value.translation;
          })
        ) {
          (view as any).readOnly = false;
        }
      }
    }

    return (
      <Comp
        {...(props as any)} // https://github.com/Microsoft/TypeScript/issues/28748
        value={currTranslation != null ? currTranslation.translation : ''}
        view={view}
        onChange={value => {
          const v: ITranslatableContent = {
            ...pvalue,
            translations: {
              ...pvalue.translations,
              [currentLanguage]: {
                ...pvalue.translations[currentLanguage],
                status: '',
                translation: value,
                lang: currentLanguage,
              },
            },
          };
          props.onChange(v);
        }}
      />
    );
  }
  return Translated;
}
