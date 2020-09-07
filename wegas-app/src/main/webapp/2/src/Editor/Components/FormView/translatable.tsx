import * as React from 'react';
import { Schema } from 'jsoninput';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { entityIs } from '../../../data/entities';
import { LabeledView } from './labeled';
import { ITranslatableContent, ITranslation } from 'wegas-ts-api';

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
        ? {}
        : {
            [lang]: createTranslation(lang, value),
          },
    version: 0,
  };
}

export function useTranslate(translatable?: ITranslatableContent | null) {
  const { lang } = React.useContext(languagesCTX);
  return translatable ? translate(translatable, lang) : '';
}

export function translate(translatable: ITranslatableContent, lang: string) {
  const translation = translatable.translations[lang];
  if (Object.keys(translatable.translations).length === 0) {
    return '';
  } else if (translation === undefined) {
    return translatable.translations[0]?.translation || '';
  } else {
    return translation.translation;
  }
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

    // Updade label
    const curCode = (
      availableLang.find(l => l.code === currentLanguage) || {
        code: '',
      }
    ).code;
    const view = React.useMemo(
      () => ({
        ...props.view,
        label: (
          <span>
            {props.view.label}{' '}
            {props.view.label !== undefined && <span>[{curCode}]</span>}
          </span>
        ),
        onLanguage: setCurrentLanguage,
      }),
      [props.view, curCode],
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
