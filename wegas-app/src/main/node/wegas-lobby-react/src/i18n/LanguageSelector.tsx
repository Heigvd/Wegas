/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faGlobeAmericas } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import DropDownMenu from '../components/common/DropDownMenu';
import { mainMenuLink } from '../components/common/Link';
import { mainHeaderHeight } from '../components/styling/style';
import { I18nCtx, Language } from './I18nContext';

export default function LanguageSelector() {
  const { lang, setLang } = React.useContext(I18nCtx);

  const entries: { value: Language; label: React.ReactNode }[] = [
    { value: 'EN', label: <div className={mainMenuLink}>English</div> },
    { value: 'FR', label: <div className={mainMenuLink}>Français</div> },
  ];
  const valueComp: { value: Language; label: React.ReactNode } =
    lang == 'EN'
      ? { value: 'EN', label: <div className={mainMenuLink}>EN</div> }
      : { value: 'FR', label: <div className={mainMenuLink}>FR</div> };

  return (
    <DropDownMenu
      height={mainHeaderHeight}
      icon={faGlobeAmericas}
      value={lang}
      valueComp={valueComp}
      entries={entries}
      onSelect={setLang}
      idleHoverStyle="BACKGROUND"
    />
  );
}
