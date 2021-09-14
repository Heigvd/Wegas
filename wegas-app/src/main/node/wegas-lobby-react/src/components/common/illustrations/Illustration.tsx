/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons/';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { resolveColor, white } from '../../styling/color';
import './fontello.css';
import { getIconDef, IconDef } from './illustrationHelper';

library.add(fas, far);

export type SizeType = 'BIG' | 'MEDIUM' | 'SMALL';

export interface Props {
  value: string | null | undefined;
  size: SizeType;
}

function getSize(s: SizeType) {
  switch (s) {
    case 'SMALL':
      return '48px';
    case 'MEDIUM':
      return '64px';
    case 'BIG':
      return '80px';
  }
}

function getIconSize(s: SizeType) {
  switch (s) {
    case 'SMALL':
      return '24px';
    case 'MEDIUM':
      return '32px';
    case 'BIG':
      return '40px';
  }
}

const whiteColor = white.toString();

const illustrationStyle = (color: string, backgroundColor: string, size: SizeType) =>
  css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor,
    color: color,
    width: getSize(size),
    minWidth: getSize(size),
    minHeight: getSize(size),
    height: '100%',
    lineHeight: getSize(size),
    fontSize: getIconSize(size),
    textAlign: 'center',
  });

export function IconDisplay({
  icon,
  size,
  fgColor,
  bgColor,
}: {
  bgColor: string;
  fgColor: string;
  icon: IconDef;
  size: SizeType;
}): JSX.Element {
  if (icon.library === 'icon') {
    return (
      <div className={illustrationStyle(fgColor, bgColor, size)}>
        <i className={`${icon.library} ${icon.library}-${icon.key}`} />
      </div>
    );
  } else if (icon.library === 'fa' || icon.library === 'far') {
    const lib = icon.library === 'fa' ? 'fas' : icon.library;
    return (
      <div className={illustrationStyle(fgColor, bgColor, size)}>
        <FontAwesomeIcon icon={[lib, icon.key]} />
      </div>
    );
  } else {
    return <></>;
  }
}

export default function Illustration({ value, size = 'BIG' }: Props): JSX.Element {
  if (value != null) {
    const [type = 'ICON', color = 'orange', key = 'gamepad', library = 'fa'] = value.split('_');

    const theColor = resolveColor(color);

    if (type === 'ICON') {
      const iconDef = getIconDef(library, key);
      if (iconDef != null) {
        return <IconDisplay fgColor={whiteColor} bgColor={theColor} size={size} icon={iconDef} />;
      }
    }
    // broken
    return (
      <div className={illustrationStyle(whiteColor, theColor, size)} title={value}>
        <FontAwesomeIcon icon={'times'} />
      </div>
    );
  } else {
    return (
      <div className={illustrationStyle(whiteColor, 'red', size)} title="unset">
        <FontAwesomeIcon icon={'times'} />
      </div>
    );
  }
}
