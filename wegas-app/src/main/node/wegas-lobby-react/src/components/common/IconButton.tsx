/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { FlipProp, IconProp, SizeProp, Transform } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { iconStyle, linkStyle } from '../styling/style';
import Clickable from './Clickable';

export interface IconButtonProps {
  onClick?: () => void;
  icon: IconProp;
  iconSize?: SizeProp;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  reverseOrder?: boolean;
  iconColor?: string;
  pulse?: boolean;
  spin?: boolean;
  flip?: FlipProp;
}

export default function IconButton({
  onClick,
  icon,
  title,
  children,
  className,
  reverseOrder,
  iconColor,
  iconSize,
  spin,
  pulse,
  flip,
}: IconButtonProps): JSX.Element {
  return (
    <Clickable
      onClick={onClick}
      title={title}
      className={cx(iconStyle, className)}
      clickableClassName={cx(linkStyle, className)}
    >
      {reverseOrder ? children : null}
      <FontAwesomeIcon
        className={css({ padding: '0 5px' })}
        icon={icon}
        flip={flip}
        color={iconColor}
        size={iconSize}
        spin={spin}
        pulse={pulse}
      />
      {!reverseOrder ? children : null}
    </Clickable>
  );
}

export interface LayeredIconButtonProps {
  onClick?: () => void;
  icons: {
    icon: IconProp;
    transform?: Transform | string;
    color?: string;
  }[];
  title?: string;
  children?: React.ReactNode;
  className?: string;
  reverseOrder?: boolean;
}

export function LayeredIconButton({
  onClick,
  icons,
  title,
  children,
  className,
  reverseOrder,
}: LayeredIconButtonProps): JSX.Element {
  return (
    <Clickable
      onClick={onClick}
      title={title}
      className={cx(iconStyle, className)}
      clickableClassName={cx(linkStyle, className)}
    >
      {reverseOrder ? children : null}
      <span className="fa-layers fa-fw">
        {icons.map((ic, i) => (
          <FontAwesomeIcon
            key={i}
            className={css({ padding: '0 5px' })}
            icon={ic.icon}
            color={ic.color}
            transform={ic.transform}
          />
        ))}
      </span>
      {!reverseOrder ? children : null}
    </Clickable>
  );
}
