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
import Logo from '../styling/Logo';
import { fullPageStyle, lightMode } from '../styling/style';
import Flex from './Flex';

export interface MelonProps {
  children: React.ReactNode;
  below?: React.ReactNode;
  uberBelow?: React.ReactNode;
}

const mediaQ = "@media (max-height: 600px)";

export default function MelonContainer({children, below, uberBelow}: MelonProps): JSX.Element {
  return (
    <div className={cx(fullPageStyle)}>
      <Flex
        direction="column"
        className={cx(
          css({
            margin: 'auto',
            overflow: 'auto',
            [mediaQ]: {
              margin: 0,
            }
          }),
        )}
      >
        <div className={css({ alignSelf: 'flex-end' })}>
          <LanguageSelector />
        </div>
        <div
          className={cx(
            lightMode,
            css({
              overflow: 'auto',
              padding: '32px 32px',
              borderRadius: '6px',
              [mediaQ]: {
                padding: "8px",
                overflow: 'unset',
              }
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
                maxHeight: '50px',
                width: '300px',
                margin: 'auto',
                [mediaQ]: {
                    display: "none"
                }
              })}
            />
            {children}
          </Flex>
        </div>
        {below}
      </Flex>
        {uberBelow}
    </div>
  );
}
