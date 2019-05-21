import * as React from 'react';
import { Schema } from 'jsoninput';
import { LangContext } from '../../../Components/LangContext';

interface TranslatableProps {
  value?: ITranslatableContent;
  onChange: (value: ITranslatableContent) => void;
  view: Schema['view'] & { label?: string };
}

interface EndProps {
  value?: string | number;
  onChange: (value: string) => void;
  view: { label?: JSX.Element; [prop: string]: unknown };
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
    const { lang, availableLang } = React.useContext(LangContext);

    // Updade label
    const curCode = (
      availableLang.find(l => l.code === lang) || {
        code: '',
      }
    ).code;
    const view = React.useMemo(
      () => ({
        ...props.view,
        label: (
          <span>
            {props.view.label} <span>[{curCode}]</span>
          </span>
        ),
      }),
      [props.view, curCode],
    );
    const pvalue: ITranslatableContent =
      props.value == null
            ? {'@class': 'TranslatableContent', translations: {}, version: 0 }
        : props.value;
    const currTranslation = pvalue.translations[lang];
    return (
      <Comp
        {...props as any} // https://github.com/Microsoft/TypeScript/issues/28748
        value={
          currTranslation != null ? currTranslation.translation : undefined
        }
        view={view}
        onChange={value => {
          const v: ITranslatableContent = {
            ...pvalue,
            translations: {
              ...pvalue.translations,
              [lang]: {
                ...pvalue.translations[lang],
                translation: value,
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
