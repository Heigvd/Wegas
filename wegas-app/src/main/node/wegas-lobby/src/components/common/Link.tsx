/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCog, faCubes, faGamepad, faGavel, faMagic } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom';
import tinycolor from 'tinycolor2';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import {
  adminColor,
  modelerColor,
  playerColor,
  scenaristColor,
  trainerColor,
  white,
} from '../styling/color';
import { buttonStyle, mainHeaderHeight } from '../styling/style';
import DropDownMenu from './DropDownMenu';
import WegasIcon, { WegasIconType } from './illustrations/WegasIcon';

export const linkStyle = css({
  textDecoration: 'none',
  color: 'var(--linkColor)',
  ':hover': {
    backgroundColor: 'var(--linkHoverBgColor)',
    color: 'var(--linkHoverColor)',
  },
});

export const mainMenuLink = css({
  textDecoration: 'none',
  color: 'var(--linkColor)',
  textTransform: 'uppercase',
  fontSize: '12px',
  padding: '10px 20px 10px 5px',
  ':focus': {
    /*outlineStyle: 'inset',*/
  },
  ':hover': {
    backgroundColor: '#e6e6e6',
    color: 'var(--linkHoverColor)',
  },
});

export const inlineMainMenuLink = cx(
  mainMenuLink,
  css({
    display: 'inline-block',
  }),
);

const mainLinkActiveClass = cx(
  css({
    //    borderBottom: '6px solid var(--pictoLightBlue)',
  }),
);

const darkAdminColor = new tinycolor(adminColor).darken(10).toString();

const secondLevelLinkActiveClass = cx(
  css({
    backgroundColor: `${darkAdminColor} !important`,
  }),
);

export const adminButtonStyle = cx(
  buttonStyle,
  css({
    color: white.toString(),
    backgroundColor: adminColor,
    ':hover': {
      color: white.toString(),
      backgroundColor: darkAdminColor,
    },
    ':focus': {
      color: white.toString(),
      backgroundColor: darkAdminColor,
    },
  }),
);

const secondLevelLink = cx(
  adminButtonStyle,
  css({
    marginLeft: '10px',
    textDecoration: 'none',
  }),
);

const inlineLink = cx(
  linkStyle,
  css({
    fontSize: '12px',
    textDecoration: 'none',
  }),
);

const discreetInlineLink = cx(
  inlineLink,
  css({
    fontWeight: 300,
  }),
);

interface LinkProps {
  className?: string;
  to: string;
  exact?: boolean;
  children: React.ReactNode;
  isActive?: NavLinkProps['isActive'];
}

export function MainMenuLink({
  to,
  exact = false,
  children,
  isActive,
  className,
}: LinkProps): JSX.Element {
  return (
    <NavLink
      isActive={isActive}
      exact={exact}
      to={to}
      activeClassName={cx(mainLinkActiveClass, className)}
      className={cx(inlineMainMenuLink, className)}
    >
      {children}
    </NavLink>
  );
}

export function SecondLevelLink({
  to,
  exact = false,
  children,
  isActive,
  className,
}: LinkProps): JSX.Element {
  return (
    <NavLink
      isActive={isActive}
      exact={exact}
      to={to}
      activeClassName={cx(secondLevelLinkActiveClass, className)}
      className={cx(secondLevelLink, className)}
    >
      {children}
    </NavLink>
  );
}

export function InlineLink({ to, exact = false, children, className }: LinkProps): JSX.Element {
  return (
    <NavLink exact={exact} to={to} className={cx(className, inlineLink)}>
      {children}
    </NavLink>
  );
}

export function DiscreetInlineLink({
  to,
  exact = false,
  children,
  className,
}: LinkProps): JSX.Element {
  return (
    <NavLink exact={exact} to={to} className={cx(className, discreetInlineLink)}>
      {children}
    </NavLink>
  );
}

interface Entry {
  label: string;
  link: string;
  faIcon?: IconProp;
  wifIcon?: WegasIconType;
  color: string;
}

const iconStyle = css({
  flexBasis: '45px',
  flexShrink: 0,
});

const wifIconStyle = cx(
  iconStyle,
  css({
    lineHeight: '24px',
    textAlign: 'center',
  }),
);

const flex = css({
  display: 'flex',
  alignItems: 'center',
});

export function MainMenu() {
  const { isAdmin, isModeler, isScenarist, isTrainer } = useCurrentUser();
  const i18n = useTranslations();
  const location = useLocation();

  const current = location.pathname;

  const options: Entry[] = [
    {
      label: i18n.player,
      link: '/player',
      faIcon: faGamepad,
      color: playerColor,
    },
  ];
  if (isTrainer || isAdmin || isScenarist || isModeler) {
    options.push({
      label: i18n.trainer,
      link: '/trainer',
      wifIcon: 'trainer',
      color: trainerColor,
    });
  }
  if (isAdmin || isScenarist || isModeler) {
    options.push({
      label: i18n.scenarist,
      link: '/scenarist',
      faIcon: faMagic,
      color: scenaristColor,
    });
  }
  if (isAdmin || isModeler) {
    options.push({
      label: i18n.modeler,
      link: '/modeler',
      faIcon: faCubes,
      color: modelerColor,
    });
  }

  if (isAdmin) {
    options.push({
      label: i18n.admin,
      link: '/admin',
      faIcon: faGavel,
      color: adminColor,
    });
  }

  const currentOption = options.find(opt => current != null && current.startsWith(opt.link));
  const valueComp =
    currentOption != null
      ? {
          value: currentOption.link,
          label: (
            <div className={cx(mainMenuLink, flex)}>
              {currentOption.faIcon != null ? (
                <FontAwesomeIcon className={iconStyle} icon={currentOption.faIcon} size="2x" />
              ) : currentOption.wifIcon != null ? (
                <WegasIcon
                  className={wifIconStyle}
                  icon={currentOption.wifIcon}
                  color={'var(--linkColor)'}
                  size="28px"
                />
              ) : null}{' '}
              {currentOption.label}
            </div>
          ),
        }
      : current.startsWith('/settings')
      ? {
          value: 'settings',
          label: (
            <div className={cx(mainMenuLink, flex)}>
              <FontAwesomeIcon className={iconStyle} icon={faCog} size="2x" /> {i18n.settings}
            </div>
          ),
        }
      : undefined;

  const opts = options.map(opt => ({
    value: opt.link,
    label: (
      <MainMenuLink className={flex} key={opt.link} exact to={opt.link}>
        {opt.faIcon != null ? (
          <FontAwesomeIcon className={iconStyle} icon={opt.faIcon} color={opt.color} size="2x" />
        ) : opt.wifIcon != null ? (
          <WegasIcon className={wifIconStyle} icon={opt.wifIcon} color={opt.color} size="28px" />
        ) : null}
        <div className={css({ paddingRight: '20px' })}>{opt.label}</div>
      </MainMenuLink>
    ),
  }));

  return (
    <DropDownMenu
      height={mainHeaderHeight}
      idleHoverStyle="BACKGROUND"
      menuIcon="BURGER"
      entries={opts}
      value={current}
      valueComp={valueComp}
    />
  );
}
