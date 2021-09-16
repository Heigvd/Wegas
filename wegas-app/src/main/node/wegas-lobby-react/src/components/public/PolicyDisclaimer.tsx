/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {css} from '@emotion/css';
import * as React from 'react';
import useTranslations from '../../i18n/I18nContext';

export default function PolicyDisclaimer(): JSX.Element {
  const i18n = useTranslations();

  return (
    <i className={css({padding: "5px", maxWidth:"600px"})}>
      {`${i18n.agreementDisclaimer} `}
      <a target="_blank" rel="noreferrer" href={i18n.termOfUseUrl}>
        &nbsp;{i18n.termOfUse}
      </a>
      {` ${i18n.and} `}
      <a target="_blank" rel="noreferrer" href={i18n.dataPolicyUrl}>
        {i18n.dataPolicy}
      </a>
    </i>
  );
}
