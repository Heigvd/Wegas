import * as React from 'react';

import { languagesCTX } from '../../Components/Contexts/LanguagesProvider';
import { translate } from '../../data/i18n';

export function useTranslate(
  translatable?: ITranslatableContent | STranslatableContent | null,
) {
  const { lang, availableLang } = React.useContext(languagesCTX);
  return translatable ? translate(translatable, lang, availableLang) : '';
}

