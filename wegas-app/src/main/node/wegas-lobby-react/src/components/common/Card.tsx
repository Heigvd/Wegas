/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { cardStyle } from '../styling/style';
import FitSpace from './FitSpace';
import Illustration, { SizeType } from './illustrations/Illustration';
import WegasIcon, { WegasIconType } from './illustrations/WegasIcon';

export interface CardProps {
  illustration?: string;
  children?: React.ReactNode;
  className?: string;
  size?: SizeType;
}

const cardContentStyle = css({
  padding: '0 10px',
  alignItems: 'center',
});

export default function Card({
  children,
  className,
  illustration = 'ICON_black-blue_cogs_fa',
  size = 'BIG',
}: CardProps): JSX.Element {
  return (
    <div className={cx(cardStyle, className)}>
      <Illustration value={illustration} size={size} />
      <FitSpace direction="row" className={cardContentStyle}>
        {children}
      </FitSpace>
    </div>
  );
}

interface CardMainButtonProps {
  title: string;
  icon: IconProp;
  url: string;
  bgColor?: string;
  fgColor?: string;
}

const cardMainButtonStyle = (bgColor: string) =>
  css({
    color: bgColor,
    transition: '0.3s',
    ':hover': {
      color: '#06b7e8',
    },
    //    ':focus': {
    //      color: '#06b7e8',
    //    },
  });

export function CardMainButton({
  icon,
  title,
  url,
  bgColor = 'var(--fgColor)',
  fgColor = 'var(--bgColor)',
}: CardMainButtonProps) {
  return (
    <a
      className={cardMainButtonStyle(bgColor)}
      title={title}
      target="_blank"
      rel="noreferrer"
      href={url}
    >
      <span className="fa-layers fa-fw fa-3x">
        <FontAwesomeIcon icon={faCircle} />
        <FontAwesomeIcon icon={icon} color={fgColor} transform="shrink-10" />
      </span>
    </a>
  );
}
interface CardMainWifButtonProps {
  title: string;
  icon: WegasIconType;
  url: string;
  bgColor?: string;
  fgColor?: string;
}

const wifInFaLayers = css({
  position: 'absolute',
  left: '0',
  right: '0',
  top: '6px',
});

export function CardMainWifButton({
  icon,
  title,
  url,
  bgColor = 'var(--fgColor)',
  fgColor = 'var(--bgColor)',
}: CardMainWifButtonProps) {
  return (
    <a
      className={cardMainButtonStyle(bgColor)}
      title={title}
      target="_blank"
      rel="noreferrer"
      href={url}
    >
      <span className="fa-layers fa-fw fa-3x">
        <FontAwesomeIcon icon={faCircle} />
        <WegasIcon className={wifInFaLayers} color={fgColor} icon={icon} size="32px" />
      </span>
    </a>
  );
}

export const cardSecButtonStyle = css({
  width: '28px',
  display: 'inline-block',
  textAlign: 'center',
});
