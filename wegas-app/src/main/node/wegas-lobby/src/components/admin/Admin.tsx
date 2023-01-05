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
import { Route, Routes } from 'react-router-dom';
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
  // const { path, url } = useRouteMatch();
  return (
    <FitSpace direction="column" overflow="auto">
      <FitSpace direction="column" overflow="auto">
        <Flex
          align="center"
          justify="center"
          className={css({ borderBottom: `2px solid ${adminColor.toString()}` })}
        >
          <SecondLevelLink end to={`./`}>
            {i18n.adminPanel}
          </SecondLevelLink>
          <SecondLevelLink to={`who`}>{i18n.who}</SecondLevelLink>
          <SecondLevelLink to={`users`}>{i18n.users}</SecondLevelLink>
          <SecondLevelLink to={`roles`}>{i18n.roles}</SecondLevelLink>
          <SecondLevelLink to={`invoices`}>{i18n.gameAdmins}</SecondLevelLink>
          <SecondLevelLink to={`loggers`}>{i18n.loggers}</SecondLevelLink>
          <SecondLevelLink to={`locks`}>{i18n.locks}</SecondLevelLink>
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
          <Routes>
            <Route
              path={`who/*`}
              element={
                <>
                  {' '}
                  <Who />{' '}
                </>
              }
            />
            <Route
              path={`users/*`}
              element={
                <>
                  {' '}
                  <Users />{' '}
                </>
              }
            />
            <Route
              path={`roles/*`}
              element={
                <>
                  {' '}
                  <Roles />{' '}
                </>
              }
            />
            <Route
              path={`loggers/*`}
              element={
                <>
                  {' '}
                  <LoggersConfig />{' '}
                </>
              }
            />
            <Route
              path={`locks/*`}
              element={
                <>
                  <FitSpace direction="column" overflow="auto" className={panelPadding}>
                    <Locks />
                  </FitSpace>
                </>
              }
            />
            <Route
              path={`invoices/*`}
              element={
                <>
                  <FitSpace direction="column" overflow="auto" className={panelPadding}>
                    <Invoicing />
                  </FitSpace>
                </>
              }
            />
            <Route
              path='*'
              element={
                <>
                  {' '}
                  <MainAdminPanel />{' '}
                </>
              }
            />
          </Routes>
        </FitSpace>
      </FitSpace>
    </FitSpace>
  );
}
