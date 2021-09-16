/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import useTranslations from '../../i18n/I18nContext';
import Clickable from './Clickable';
import IconButton from './IconButton';

export interface Props {
  icon: IconProp;
  title: string;
  className?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
}

const relative = css({
  position: 'relative',
});

const bubbleStyle = (position: 'LEFT' | 'RIGHT' | 'CENTER') => {
  const left = position === 'LEFT' ? '100%' : position === 'CENTER' ? '50%' : '0%';

  const translate = position === 'LEFT' ? '-100%' : position === 'CENTER' ? '-50%' : '0%';

  const caretLeft =
    position === 'RIGHT'
      ? '7px'
      : position === 'CENTER'
      ? 'calc(50%  - 10px)'
      : 'calc(100% - 21px)';

  return css({
    position: 'absolute',
    '--fgColor': '#FEFEFE',
    '--hoverFgColor': '#FEFEFE',
    '--hoverBgColor': '#06b7e8',
    '--linkColor': '#fefefe',
    '--bgColor': 'var(--blueColor)',
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    display: 'flex',
    borderRadius: '3px',
    //overflow: 'auto',
    //    padding: '2px 4px',
    top: 'calc(100% + 5px)',
    left: left, // move to the right so the left side aligns with the middle of its parent
    translate: translate, // then translate to align both middles
    zIndex: 999,
    '::after': {
      content: '""',
      position: 'absolute',
      top: '-5px',
      width: '0',
      height: '0',
      borderLeft: '7px solid transparent',
      borderRight: '7px solid transparent',
      borderBottom: '5px solid var(--blueColor)',
      left: caretLeft,
    },
    '& > span:first-child': {
      borderTopLeftRadius: '3px',
      borderBottomLeftRadiusLeftRadius: '3px',
    },
    '& > span:last-child': {
      borderTopRightRadius: '3px',
      borderBottomRightRadiusLeftRadius: '3px',
    },
    '& > *': {
      flexBasis: '1px',
      width: '50%',
    },
  });
};

const bubbleItem = css({
  padding: '0 5px',
  textTransform: 'uppercase',
  fontSize: '0.8em',
});

export function InlineConfirmIconButton({
  children,
  className,
  icon,
  onConfirm,
  title,
}: Props): JSX.Element {
  const [waitConfirm, setConfirm] = React.useState(false);
  const i18n = useTranslations();

  const askConfirm = React.useCallback(() => {
    setConfirm(false);
  }, []);

  const confirmedCb = React.useCallback(() => {
    setConfirm(false);
    onConfirm();
  }, [onConfirm]);

  return (
    <div title={title || i18n.confirm}>
      {waitConfirm ? (
        <IconButton className={className} icon={icon}>
          <IconButton title={`${i18n.cancel} ${title}`} icon={faTimes} onClick={askConfirm} />
          <IconButton title={`${i18n.confirm} ${title}`} icon={faCheck} onClick={confirmedCb} />
        </IconButton>
      ) : (
        <div>
          <IconButton className={className} icon={icon} onClick={() => setConfirm(true)}>
            {children}
          </IconButton>
        </div>
      )}
    </div>
  );
}

export interface BubbledProps {
  icon: IconProp;
  title: string;
  className?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  confirmInvite?: string;
  cancelInvite?: string;
  position?: 'LEFT' | 'CENTER' | 'RIGHT';
}

export function ConfirmIconButton({
  children,
  className,
  icon,
  onConfirm,
  title,
  cancelInvite,
  confirmInvite,
  position = 'CENTER',
}: BubbledProps): JSX.Element {
  const [waitConfirm, setConfirm] = React.useState(false);
  const i18n = useTranslations();

  const askConfirm = React.useCallback(() => {
    setConfirm(false);
  }, []);

  const confirmedCb = React.useCallback(() => {
    setConfirm(false);
    onConfirm();
  }, [onConfirm]);

  const clickIn = React.useCallback((event: React.MouseEvent<HTMLDivElement> | undefined) => {
    if (event != null) {
      event.stopPropagation();
    }
  }, []);

  const clickOut = React.useCallback(() => {
    askConfirm();
  }, [askConfirm]);

  React.useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    body.addEventListener('click', clickOut);
    return () => {
      body.removeEventListener('click', clickOut);
    };
  }, [clickOut]);

  return (
    <div className={relative} title={title} onClick={clickIn}>
      <div>
        <IconButton className={className} icon={icon} onClick={() => setConfirm(true)}>
          {children}
        </IconButton>
      </div>
      {waitConfirm ? (
        <div className={bubbleStyle(position)}>
          <Clickable title={`${i18n.cancel} ${title}`} onClick={askConfirm}>
            <span className={bubbleItem}>{cancelInvite || i18n.cancel}</span>
          </Clickable>
          <span>|</span>
          <Clickable title={`${i18n.confirm} ${title}`} onClick={confirmedCb}>
            <span className={bubbleItem}>{confirmInvite || i18n.confirm}</span>
          </Clickable>
        </div>
      ) : null}
    </div>
  );
}

//  WITH ICONS:
//        <div className={bubbleStyle}>
//          <IconButton title={`cancel ${title}`}  icon={faTimes} onClick={askConfirm} />
//          <IconButton title={`confirm ${title}`}  icon={faCheck} onClick={confirmedCb} />
//        </div>
