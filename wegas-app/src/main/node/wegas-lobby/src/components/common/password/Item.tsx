/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2023 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import React from 'react';

interface PasswordStrengthBarItemProps {
  score: number;
  itemNum: number;
  barColors: string[];
}

const itemStyle = css({
  flexBasis: 0,
  flexGrow: 1,
  position: 'relative',
  maxWidth: '100%',
  width: '100%',
  height: 2,
});

const Item = (props: PasswordStrengthBarItemProps) => {
  let bgColor = props.barColors[0];
  if (props.score >= props.itemNum) {
    bgColor = props.barColors[props.score];
  }

  return (
    <div className={cx(itemStyle, css({
        backgroundColor: bgColor,
      }))}
    />
  );
};
export default Item;