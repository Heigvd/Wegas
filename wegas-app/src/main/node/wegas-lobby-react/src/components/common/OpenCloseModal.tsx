/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { NavLink, Route, Switch, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { linkStyle } from '../styling/style';
import { cardSecButtonStyle } from './Card';
import IconButton from './IconButton';
import Modal from './Modal';
import OpenClose from './OpenClose';

interface Props {
  iconTitle: string;
  title: string;
  iconChildren?: React.ReactNode;
  iconClassName?: string;
  children: (collapse: () => void) => React.ReactNode;
  showCloseButton?: boolean;
  illustration?: string;
  icon: IconProp;
  route?: string;
}

export default function OptionCloseModal({
  icon,
  iconTitle,
  iconChildren,
  iconClassName = cardSecButtonStyle,
  title,
  children,
  route,
  showCloseButton = false,
  illustration = 'ICON_black-blue_cogs_fa',
}: Props): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();

  const onClose = React.useCallback(() => {
    match;
    if (route != null) {
      history.push(match.url);
    }
  }, [history, route, match]);

  if (route != null) {
    return (
      <Switch>
        <Route path={`${match.path}${route}`}>
          <IconButton className={iconClassName} title={iconTitle} icon={icon}>
            {iconChildren}
          </IconButton>
          {location.pathname.startsWith(`${match.path}${route}`) ? (
            <Modal
              title={title}
              illustration={illustration}
              onClose={onClose}
              showCloseButton={showCloseButton}
            >
              {onCloseModal => children(onCloseModal)}
            </Modal>
          ) : null}
        </Route>
        <Route>
          <NavLink className={linkStyle} to={`${match.url}${route}`}>
            <IconButton className={iconClassName} title={iconTitle} icon={icon}>
              {iconChildren}
            </IconButton>
          </NavLink>
        </Route>
      </Switch>
    );
  } else {
    return (
      <OpenClose
        collaspedChildren={
          <IconButton className={iconClassName} title={iconTitle} icon={icon}>
            {iconChildren}
          </IconButton>
        }
        showCloseIcon="KEEP_CHILD"
      >
        {onClose => (
          <Modal
            title={title}
            illustration={illustration}
            onClose={onClose}
            showCloseButton={showCloseButton}
          >
            {onCloseModal => children(onCloseModal)}
          </Modal>
        )}
      </OpenClose>
    );
  }
}
