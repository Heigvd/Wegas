/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { cardStyle } from '../styling/style';
import FitSpace from './FitSpace';
import IconButton from './IconButton';
import Illustration from './illustrations/Illustration';
import Overlay from './Overlay';

interface Props {
  title: string;
  children: (collapse: () => void) => React.ReactNode;
  showCloseButton?: boolean;
  onClose: () => void;
  illustration?: string;
}
const backgroundStyle = css({
  backgroundColor: 'rgba(0,0,0, 0.6)',
});

const modalStyle = cx(
  cardStyle,
  css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '800px',
    height: '580px',
    boxShadow: '0 3px 6px rgba(0,0,0,.16)',
    borderRadius: '8px',
    overflow: 'auto',
  }),
);

export const modalSeparatorBorder = 'solid 1px #d7d7d7';

const modalHeader = css({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  borderBottom: modalSeparatorBorder,
});

const titleStyle = css({
  fontSize: '24px',
  paddingLeft: '20px',
  fontWeight: 200,
});

const closeIconStyle = css({
  width: '64px',
  textAlign: 'center',
});

const modalBody = css({
  width: '100%',
});

export default function Modal({
  onClose,
  title,
  children,
  showCloseButton = false,
  illustration = 'ICON_black-blue_cogs_fa',
}: Props): JSX.Element {
  return (
    <Overlay backgroundStyle={backgroundStyle} clickOutside={onClose}>
      <div className={modalStyle}>
        <div className={modalHeader}>
          <Illustration value={illustration} size="MEDIUM" />
          <FitSpace direction="column" className={titleStyle}>
            {title}
          </FitSpace>
          {showCloseButton ? (
            <IconButton className={closeIconStyle} iconSize="2x" icon={faTimes} onClick={onClose} />
          ) : null}
        </div>
        <FitSpace direction="column" overflow="auto" className={modalBody}>
          {children(onClose)}
        </FitSpace>
      </div>
    </Overlay>
  );
}
