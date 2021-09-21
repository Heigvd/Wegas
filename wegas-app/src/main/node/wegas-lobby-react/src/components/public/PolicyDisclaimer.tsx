/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import useTranslations from '../../i18n/I18nContext';

const disclaimerStyle = css({
  display: 'flex',
  alignItems: 'center',
  position: 'fixed',
  left: '50%',
  bottom: 0,
  transform: 'translateX(-50%)',
  margin: '0 auto',
  padding: '20px',
  width: '80%',
  maxWidth: '600px',
  backgroundColor: 'var(--bgColor)',
  borderRadius: '8px 8px 0 0',
  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)'
});

const hide = css({
  display: 'none',
})

export default function PolicyDisclaimer(): JSX.Element {
  const i18n = useTranslations();
  const [showDisclaimer, setShowDisclaimer] = React.useState(true);

  return (
    <div className={cx(disclaimerStyle,{
      [hide]: !showDisclaimer
    })}>
    <i className={css({ padding: '5px', maxWidth: '600px' })}>
      {`${i18n.agreementDisclaimer} `}
      <a target="_blank" rel="noreferrer" href={i18n.termOfUseUrl}>
        &nbsp;{i18n.termOfUse}
      </a>
      {` ${i18n.and} `}
      <a target="_blank" rel="noreferrer" href={i18n.dataPolicyUrl}>
        {i18n.dataPolicy}
      </a>
    </i>
    <a onClick={()=>setShowDisclaimer(false)} className={css({ marginLeft: '10px'})}>
      <FontAwesomeIcon icon={faTimes} className={css({'&:hover': {opacity: 0.5, cursor: 'pointer'}})}/>
    </a>
    </div>
  );
}
