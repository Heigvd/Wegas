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
import { semiLightMode } from '../styling/style';
import FitSpace from './FitSpace';
import Flex from './Flex';
import IconButton from './IconButton';

interface Props {
  state: 'COLLAPSED' | 'EXPANDED';
  children: React.ReactNode;
  onClose: () => void;
}

const commonStyle = css({
  transition: '0.3s',
  position: 'absolute',
  width: '100%',
  zIndex: 1,
});

const expanded = css({
  height: '100%',
});

const collapsed = css({
  height: 0,
});

export default function DropDownPanel({ onClose, state, children }: Props): JSX.Element {
  return (
    <Flex
      overflow="auto"
      className={cx(semiLightMode, commonStyle, state === 'COLLAPSED' ? collapsed : expanded)}
      direction="column"
    >
      <Flex direction="row" justify="flex-end">
        <IconButton icon={faTimes} iconSize="2x" onClick={onClose} />
      </Flex>
      <FitSpace direction="column" overflow="auto" align="center">
        {children}
      </FitSpace>
    </Flex>
  );
}
