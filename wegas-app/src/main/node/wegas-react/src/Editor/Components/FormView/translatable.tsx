import { Schema } from 'jsoninput';
import * as React from 'react';
import {
  ITranslatableContent,
} from 'wegas-ts-api';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { entityIs } from '../../../data/entities';
import { createTranslatableContent } from '../../../data/i18n';
import { LabeledView } from './labeled';

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
    const {lang, availableLang } = React.useContext(languagesCTX);

    const view = React.useMemo(
      () => ({
        ...props.view,
        label: <span>{`${props.view.label}`}</span>,
        currentLanguage: lang,
      }),
      [props.view, lang],
    );

    const pvalue: ITranslatableContent =
      typeof props.value === 'object' &&
      entityIs(props.value, 'TranslatableContent')
        ? props.value
        : createTranslatableContent(
            lang,
            props.value == null
              ? ''
              : typeof props.value === 'string'
              ? props.value
              : JSON.stringify(props.value),
          );

    const currTranslation = pvalue.translations[lang];

    if ((view as any).readOnly) {
      // variable is protected by the model
      const theLanguage = availableLang.find(al => al.code === lang);
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
              [lang]: {
                ...pvalue.translations[lang],
                status: '',
                translation: value,
                lang: lang,
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
