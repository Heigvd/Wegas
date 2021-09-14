/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { lightMode } from '../styling/style';
import Flex from './Flex';

export const itemStyle = css({
  padding: '5px 8px',
});

interface Entry<T> {
  value: T;
  label: React.ReactNode;
}

interface Props<T> {
  icon?: IconProp;
  menuIcon?: 'BURGER' | 'CARET';
  entries: Entry<T>[];
  value: T;
  height?: string;
  valueComp?: Entry<T>;
  onSelect?: (value: T) => void;
}

const containerStyle = cx(
  lightMode,
  css({
    position: 'relative',
    minWidth: '100%',
  }),
);

const commonStyle = cx(
  lightMode,
  css({
    borderBottomRightRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,.12)',
    transition: '0.3s',
    position: 'absolute',
    minWidth: '100%',
    width: 'max-content',
    zIndex: 10,
    overflow: 'hidden',
  }),
);

const openStyle = cx(
  commonStyle,
  css({
    height: 'auto',
  }),
);

const closedStyle = cx(
  commonStyle,
  css({
    height: 0,
  }),
);

const dashStyle = css({
  width: '26px',
  height: '2px',
  background: '#272727',
  display: 'block',
  position: 'relative',
  transition: 'all .3s ease-in-out',
});

const pseudoStyle = css({
  content: '""',
  position: 'absolute',
  visibility: 'visible',
  opacity: '1',
  left: '0',
  display: 'inline-block',
  borderRadius: '1px',
});

const buttonStyle = cx(
  dashStyle,
  css({
    '&:before': cx(dashStyle, pseudoStyle, css({ top: '-8px' })),
    '&:after': cx(dashStyle, pseudoStyle, css({ top: '8px' })),
  }),
);

const openButtonStyle = cx(
  dashStyle,
  css({
    background: '0 0',
    '&:before': cx(dashStyle, pseudoStyle, css({ top: 0, transform: 'rotate(-45deg)' })),
    '&:after': cx(dashStyle, pseudoStyle, css({ top: 0, transform: 'rotate(45deg)' })),
  }),
);

export default function DropDownMenu<T extends string | number | symbol>({
  entries,
  value,
  valueComp,
  onSelect,
  icon,
  height,
  menuIcon,
}: Props<T>): JSX.Element {
  const [open, setOpen] = React.useState<boolean>(false);

  const toggle = React.useCallback(() => {
    setOpen(open => !open);
  }, []);

  const clickIn = React.useCallback((event: React.MouseEvent<HTMLDivElement> | undefined) => {
    if (event != null) {
      event.stopPropagation();
    }
  }, []);

  const clickOut = React.useCallback(() => {
    setOpen(false);
  }, []);

  const hoverStyle = css({
    padding: '0 5px',
    height: height,
    ':hover': {
      backgroundColor: '#e6e6e6',
    },
  });

  const entryStyle = css({
    textDecoration: 'none',
    ':focus': {
      outlineStyle: 'inset',
    },
    ':hover': {
      backgroundColor: '#e6e6e6',
      color: 'var(--fgColor)',
    },
  });

  React.useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    body.addEventListener('click', clickOut);
    return () => {
      body.removeEventListener('click', clickOut);
    };
  }, [clickOut]);

  if (entries.length > 0) {
    const current =
      valueComp != null ? valueComp : entries.find(entry => entry.value === value) || entries[0];

    return (
      <div onClick={clickIn} className={css({ cursor: 'pointer' })}>
        <Flex direction="column" className={css({ overflow: 'visible' })}>
          <Flex align="center" onClick={toggle} className={hoverStyle}>
            {menuIcon === 'BURGER' ? (
              <span className={open ? openButtonStyle : buttonStyle}></span>
            ) : null}
            {icon ? <FontAwesomeIcon icon={icon} /> : null}
            {current.label}
            {menuIcon === 'CARET' ? <FontAwesomeIcon icon={faCaretDown} /> : null}
          </Flex>
          <div className={containerStyle}>
            <div className={open ? openStyle : closedStyle}>
              {entries.map(entry => (
                <div
                  className={entryStyle}
                  key={String(entry.value)}
                  onClick={() => {
                    if (onSelect != null) {
                      onSelect(entry.value);
                    }
                    setOpen(false);
                  }}
                >
                  {entry.label}
                </div>
              ))}
            </div>
          </div>
        </Flex>
      </div>
    );
  } else {
    return <>n/a</>;
  }
}
