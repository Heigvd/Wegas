/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import useTranslations from '../../i18n/I18nContext';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import { adminButtonStyle, SecondLevelLink } from '../common/Link';
import { adminColor } from '../styling/color';
import { panelPadding } from '../styling/style';
import Invoicing from './Invoicing';
import { Locks } from './Locks';
import LoggersConfig from './LoggersConfig';
import MainAdminPanel from './MainAdminPanel';
import Roles from './Roles';
import Users from './Users';
import Who from './Who';

export default function Admin(): JSX.Element {
  const i18n = useTranslations();
  const { path, url } = useRouteMatch();
  return (
    <FitSpace direction="column" overflow="auto">
      <FitSpace direction="column" overflow="auto">
        <Flex
          align="center"
          justify="center"
          className={css({ borderBottom: `2px solid ${adminColor.toString()}` })}
        >
          <SecondLevelLink exact to={`${path}/`}>
            {i18n.adminPanel}
          </SecondLevelLink>
          <SecondLevelLink to={`${path}/who`}>{i18n.who}</SecondLevelLink>
          <SecondLevelLink to={`${path}/users`}>{i18n.users}</SecondLevelLink>
          <SecondLevelLink to={`${path}/roles`}>{i18n.roles}</SecondLevelLink>
          <SecondLevelLink to={`${path}/invoices`}>{i18n.gameAdmins}</SecondLevelLink>
          <SecondLevelLink to={`${path}/loggers`}>{i18n.loggers}</SecondLevelLink>
          <SecondLevelLink to={`${path}/locks`}>{i18n.locks}</SecondLevelLink>
          <IconButton
            title={i18n.stats}
            className={cx(adminButtonStyle, css({ display: 'flex' }))}
            icon={faExternalLinkAlt}
            onClick={() => {
              window.open('./stats.html');
            }}
          >
            {i18n.stats}
          </IconButton>
        </Flex>
        <FitSpace direction="column" overflow="auto">
          <Switch>
            <Route exact path={`${path}/`}>
              {' '}
              <MainAdminPanel />{' '}
            </Route>
            <Route path={`${path}/who`}>
              {' '}
              <Who />{' '}
            </Route>
            <Route path={`${path}/users`}>
              {' '}
              <Users />{' '}
            </Route>
            <Route path={`${path}/roles`}>
              {' '}
              <Roles />{' '}
            </Route>
            <Route path={`${path}/loggers`}>
              {' '}
              <LoggersConfig />{' '}
            </Route>
            <Route path={`${path}/locks`}>
              <FitSpace direction="column" overflow="auto" className={panelPadding}>
                <Locks />
              </FitSpace>
            </Route>
            <Route path={`${path}/invoices`}>
              <FitSpace direction="column" overflow="auto" className={panelPadding}>
                <Invoicing />
              </FitSpace>
            </Route>
            <Route>
              <Redirect to={url} />
            </Route>
          </Switch>
        </FitSpace>
      </FitSpace>
    </FitSpace>
  );
}
