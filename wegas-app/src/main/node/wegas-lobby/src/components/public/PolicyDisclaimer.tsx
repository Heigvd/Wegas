/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import useTranslations from '../../i18n/I18nContext';
import { useLocalStorageState } from '../../preferences';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';

export default function PolicyDisclaimer(): JSX.Element {
  const i18n = useTranslations();

  const [hidden, hide] = useLocalStorageState('policy-disclaimer-hide', false);

  if (!hidden) {
    return (
      <Flex align='center' justify='center'>
        <i
         className={css({ padding: '5px', maxWidth: '600px' })}>
          {`${i18n.agreementDisclaimer} `}
          <a target="_blank" rel="noreferrer" href={i18n.termOfUseUrl}>
            &nbsp;{i18n.termOfUse}
          </a>
          {` ${i18n.and} `}
          <a target="_blank" rel="noreferrer" href={i18n.dataPolicyUrl}>
            {i18n.dataPolicy}
          </a>
        </i>
        <IconButton className='fa-2x' icon={faTimes} onClick={() => hide(true)} />
      </Flex>
    );
  } else {
    return <></>;
  }
}
