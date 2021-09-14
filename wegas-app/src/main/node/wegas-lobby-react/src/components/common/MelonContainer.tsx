/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import LanguageSelector from '../../i18n/LanguageSelector';
import { fullPageStyle, melonMode } from '../styling/style';
import Logo from '../styling/WhiteLogo';
import Flex from './Flex';

export interface MelonProps {
  children: React.ReactNode;
  below?: React.ReactNode;
  footer?: React.ReactNode;
}

const footerStyle = css({
  position: 'absolute',
  display: 'flex',
  bottom: 0,
  left: 0,
  right: 0,
  justifyContent: 'center',
  paddingBottom: '10px',
});

export default function MelonContainer({ children, below, footer }: MelonProps): JSX.Element {
  return (
    <div className={cx(fullPageStyle)}>
      <Flex
        direction="column"
        className={cx(
          css({
            margin: 'auto',
          }),
        )}
      >
        <div className={css({ alignSelf: 'flex-end' })}>
          <LanguageSelector />
        </div>
        <div
          className={cx(
            melonMode,
            css({
              padding: '32px 32px',
              borderRadius: '6px',
            }),
          )}
        >
          <Flex
            direction="column"
            className={css({
              '& > *': {
                padding: '8px 0',
              },
            })}
          >
            <Logo
              className={css({
                height: 'auto',
                width: '300px',
              })}
            />
            {children}
          </Flex>
        </div>
        {below}
      </Flex>
      <div className={footerStyle}>{footer}</div>
    </div>
  );
}
