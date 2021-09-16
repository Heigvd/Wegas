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
}

export default function MelonContainer({ children, below }: MelonProps): JSX.Element {
  return (
    <div className={cx(fullPageStyle)}>
      <Flex
        direction="column"
        className={cx(
          css({
            margin: 'auto',
            overflow: 'auto',
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
              overflow: "auto",
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
    </div>
  );
}
