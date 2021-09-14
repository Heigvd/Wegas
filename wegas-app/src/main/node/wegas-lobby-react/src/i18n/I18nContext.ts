/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { en } from './en';
//import {fr} from './fr';

export type Language = 'FR' | 'EN';

export interface I18nState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const I18nCtx = React.createContext<I18nState>({
  lang: 'EN',
  setLang: () => {},
});

export interface WegasTranslations {}

export default function useTranslations(): typeof en {
  const { lang } = React.useContext(I18nCtx);

  if (lang === 'FR') {
    return en;
  } else {
    return en;
  }
}
