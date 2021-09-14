/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import * as API from '../API/api';
import { getDisplayName } from '../helper';
import useTranslations from '../i18n/I18nContext';
import LanguageSelector from '../i18n/LanguageSelector';
import { useCurrentUser } from '../selectors/userSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import Admin from './admin/Admin';
import FitSpace from './common/FitSpace';
import IconButton from './common/IconButton';
import InlineLoading from './common/InlineLoading';
import { MainMenu } from './common/Link';
import Loading from './common/Loading';
import Modal from './common/Modal';
import OpenCloseModal from './common/OpenCloseModal';
import Overlay from './common/Overlay';
import PlayerTab from './player/PlayerTab';
import ForgotPassword from './public/ForgotPassword';
import SignInForm from './public/SignIn';
import SignUpForm from './public/SignUp';
import ScenaristTab from './scenarist/ScenaristTab';
import { UserSettings } from './settings/UserSettings';
import {
  adminColor,
  modelerColor,
  playerColor,
  scenaristColor,
  trainerColor,
} from './styling/color';
import { fullPageStyle, mainHeaderHeight } from './styling/style';
import TrainerTab from './trainer/TrainerTab';

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function MainApp(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const location = useLocation();
  const history = useHistory();

  const {
    currentUser,
    currentAccount,
    status: currentUserStatus,
    isAdmin,
    isModeler,
    isScenarist,
    isTrainer,
  } = useCurrentUser();

  const logout = React.useCallback(() => {
    dispatch(API.signOut());
  }, [dispatch]);

  React.useEffect(() => {
    if (currentUserStatus == 'UNKNOWN') {
      // user is not known. Reload state from API
      dispatch(API.reloadCurrentUser());
    }
  }, [currentUserStatus, dispatch]);

  const wsStatus = useAppSelector(state => state.pusher);

  const wegasStatus = useAppSelector(state => state.wegas.apiStatus);

  React.useEffect(() => {
    if (wsStatus.configStatus == 'NOT_INITIALIZED') {
      dispatch(API.getPusherConfig());
    }
  }, [wsStatus.configStatus, dispatch]);

  React.useEffect(() => {
    if (wsStatus.configStatus === 'READY' && wsStatus.client === 'UNSET') {
      dispatch(API.initPusher());
    }
  }, [wsStatus.pusherStatus, wsStatus.configStatus, wsStatus.client, dispatch]);

  const reconnecting =
    wegasStatus === 'DOWN' ? (
      <Overlay>
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
          })}
        >
          <InlineLoading text={i18n.reconnecting} />
        </div>
      </Overlay>
    ) : null;

  const query = useQuery();

  if (currentUserStatus == 'UNKNOWN') {
    return <Loading />;
  } else if (currentUserStatus == 'LOADING') {
    return <Loading />;
  } else if (currentUserStatus == 'NOT_AUTHENTICATED') {
    return (
      <>
        <Switch>
          <Route exact path="/SignUp">
            <SignUpForm redirectTo={query.get('redirectTo')} />
          </Route>
          <Route exact path="/ForgotPassword">
            <ForgotPassword redirectTo={query.get('redirectTo')} />
          </Route>
          <Route exact path="/SignIn">
            <SignInForm redirectTo={query.get('redirectTo')} username={query.get('username')} />
          </Route>
          <Route>
            <SignInForm redirectTo={query.get('redirectTo')} username={query.get('username')} />
          </Route>
        </Switch>
        {reconnecting}
      </>
    );
  } else if (currentUser != null && currentAccount != null) {
    // user is authenticatd
    let borderColor = playerColor;

    if (location.pathname.startsWith('/admin')) {
      borderColor = adminColor;
    } else if (location.pathname.startsWith('/trainer')) {
      borderColor = trainerColor;
    } else if (location.pathname.startsWith('/scenarist')) {
      borderColor = scenaristColor;
    } else if (location.pathname.startsWith('/modeler')) {
      borderColor = modelerColor;
    }

    return (
      <div className={fullPageStyle}>
        <FitSpace
          direction="column"
          overflow="auto"
          className={css({
            width: '100%',
            maxWidth: '1024px',
            marginLeft: 'auto',
            marginRight: 'auto',
          })}
        >
          <div
            className={cx(
              css({
                borderBottom: `2px solid ${borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,.12)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: mainHeaderHeight,
                boxSizin: 'border-box',
              }),
            )}
          >
            <MainMenu />
            <div
              className={css({
                flexGrow: 1,
              })}
            ></div>

            <OpenCloseModal
              icon={faUser}
              iconTitle={i18n.settings}
              iconChildren={getDisplayName(currentAccount)}
              iconClassName={css({
                color: 'var(--linkColor)',
                textTransform: 'uppercase',
                fontSize: '12px',
                padding: '10px 20px 10px 5px',
              })}
              showCloseButton={true}
              title={i18n.settings}
            >
              {close => <UserSettings userId={currentUser.id} close={close} />}
            </OpenCloseModal>

            <LanguageSelector />

            <IconButton onClick={logout} icon={faSignOutAlt} />
          </div>

          <div
            className={css({
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              '& > *': {
                flexGrow: 1,
              },
            })}
          >
            <Switch>
              <Route path="/player">
                <PlayerTab />
              </Route>
              <Route path="/trainer">
                {isTrainer ? <TrainerTab /> : <Redirect to="/player" />}
              </Route>
              <Route path="/scenarist">
                {isScenarist ? (
                  <ScenaristTab gameModelType="SCENARIO" />
                ) : (
                  <Redirect to="/trainer" />
                )}
              </Route>
              <Route path="/modeler">
                {isModeler ? <ScenaristTab gameModelType="MODEL" /> : <Redirect to="/scenarist" />}
              </Route>
              <Route path="/user-profile">
                <Modal
                  title={i18n.settings}
                  onClose={() => {
                    history.push('/');
                  }}
                >
                  {close => <UserSettings userId={currentUser.id} close={close} />}
                </Modal>
              </Route>
              <Route path="/admin">{isAdmin ? <Admin /> : <Redirect to="/scenarist" />}</Route>
              <Route>
                {/* no matching route, redirect to projects */}
                <Redirect to="/player" />
              </Route>
            </Switch>
          </div>
        </FitSpace>
        {reconnecting}
      </div>
    );
  } else {
    return (
      <Overlay>
        <i>Inconsistent state</i>
      </Overlay>
    );
  }
}
