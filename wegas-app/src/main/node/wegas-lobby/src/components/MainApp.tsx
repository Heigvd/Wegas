/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {css, cx, keyframes} from '@emotion/css';
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import * as API from '../API/api';
import { entityIs } from '../API/entityHelper';
import { getDisplayName } from '../helper';
import useTranslations from '../i18n/I18nContext';
import LanguageSelector from '../i18n/LanguageSelector';
import { useCurrentUser } from '../selectors/userSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import Admin from './admin/Admin';
import FitSpace from './common/FitSpace';
import IconButton from './common/IconButton';
import { MainMenu } from './common/Link';
import Loading from './common/Loading';
import Modal from './common/Modal';
import OpenCloseModal from './common/OpenCloseModal';
import Overlay from './common/Overlay';
import PlayerTab from './player/PlayerTab';
import ForgotPassword from './public/ForgotPassword';
import PleaseAcceptPolicy from './public/PleaseAcceptPolicy';
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
import { fullPageStyle, fullWidthWarningBanner, mainHeaderHeight } from './styling/style';
import TrainerTab from './trainer/TrainerTab';
import Announcer from "./common/Announcer";
import { FloatingLayer } from './common/FloatingLayer'


// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function MainApp(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

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

  const { wsStatus, wegasStatus } = useAppSelector(state => ({
      wsStatus: state.pusher,
      wegasStatus: state.wegas.apiStatus,
  }))

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
      <>
        <FloatingLayer>
          <Announcer critical floating />
        </FloatingLayer>
        <Overlay>
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
                flexDirection: 'column'
            })}
          >
              <div
                  className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                  })}
              >
                  <TumbleLoader />
                  <p>{i18n.reconnecting}</p>
              </div>
          </div>
        </Overlay>
      </>
    ) : null;

  const query = useQuery();

  if (currentUserStatus == 'UNKNOWN') {
    return <Loading />;
  } else if (currentUserStatus == 'LOADING') {
    return <Loading />;
  } else if (currentUserStatus == 'NOT_AUTHENTICATED') {
    return (
      <>
        <Routes>
          <Route
            path="/SignUp"
            element={
              <>
                <SignUpForm redirectTo={query.get('redirectTo')} />
              </>
            }
          />
          <Route
            path="/ForgotPassword"
            element={
              <>
                <ForgotPassword redirectTo={query.get('redirectTo')} />
              </>
            }
          />
          <Route
            path="/SignIn"
            element={
              <>
                <SignInForm redirectTo={query.get('redirectTo')} username={query.get('username')} />
              </>
            }
          />
          <Route
            path='*'
            element={
              <>
                <SignInForm redirectTo={query.get('redirectTo')} username={query.get('username')} />
              </>
            }
          />
        </Routes>
        {reconnecting}
      </>
    );
  } else if (currentUser != null && currentAccount != null) {
    // user is authenticatd

    if (currentAccount.agreedTime == null && !entityIs(currentAccount, 'GuestJpaAccount')) {
      // but user dit not accept term of uses
      return <PleaseAcceptPolicy />;
    }

    let borderColor = playerColor;

    switch (true) {
      case location.pathname.startsWith('/player'):
        break;
      case location.pathname.startsWith('/trainer'):
        borderColor = trainerColor;
        break;
      case location.pathname.startsWith(('/scenarist')):
        borderColor = scenaristColor;
        break;
      case location.pathname.startsWith(('/modeler')):
        borderColor = modelerColor;
        break;
      case location.pathname.startsWith(('/admin')):
        borderColor = adminColor;
        break;
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
          {wegasStatus === 'OUTDATED' ? (
            <div className={fullWidthWarningBanner}>
              {i18n.outadateMessagePart1}
              <a href="#" onClick={() => window.location.reload()}>
                {i18n.outadateMessagePart2}
              </a>
              {i18n.outadateMessagePart3}
            </div>
          ) : null}
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
                padding: '18px 20px 15px 5px',
                ':hover': {
                  backgroundColor: '#e6e6e6',
                },
              })}
              showCloseButton={true}
              title={i18n.settings}
            >
              {close => <UserSettings userId={currentUser.id} close={close} />}
            </OpenCloseModal>

            <LanguageSelector />

            <IconButton
              className={css({
                padding: '15px 5px 14px 0px',
                ':hover': {
                  backgroundColor: '#e6e6e6',
                },
              })}
              iconColor="#666"
              onClick={logout}
              icon={faSignOutAlt}
            />
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
            <Routes>
              <Route
                path="/player/*"
                element={
                  <>
                    <PlayerTab />
                  </>
                }
              />
              <Route
                path="/trainer/*"
                element={<>{isTrainer ? <TrainerTab /> : <Navigate to="/player" />}</>}
              />
              <Route
                path="/scenarist/*"
                element={
                  <>
                    {isScenarist ? (
                      <ScenaristTab gameModelType="SCENARIO" />
                    ) : (
                      <Navigate to="/trainer" />
                    )}
                  </>
                }
              />
              <Route
                path="/modeler/*"
                element={
                  <>
                    {isModeler ? (
                      <ScenaristTab gameModelType="MODEL" />
                    ) : (
                      <Navigate to="/scenarist" />
                    )}
                  </>
                }
              />
              <Route
                path="/user-profile/*"
                element={
                  <>
                    <Modal
                      title={i18n.settings}
                      onClose={() => {
                        navigate('/');
                      }}
                    >
                      {close => <UserSettings userId={currentUser.id} close={close} />}
                    </Modal>
                  </>
                }
              />
              <Route
                path="/admin/*"
                element={<> {isAdmin ? <Admin /> : <Navigate to="/scenarist" />}</>}
              />
              <Route
                path="*"
                element={
                  <>
                    {/* no matching route, redirect to projects */}
                    <Navigate to="/player" />
                  </>
                }
              />
            </Routes>
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

// Animated Loader based on wegas-react one.
// Best to make it a component once design is discussed
const animationMoves = keyframes`
  0%,
  100% { box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 0);}
  20% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 1), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 0); }
  40% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 0), 2em 0em 0 0 rgba(0, 0, 0, 1), 0em 2em 0 0 rgba(0, 0, 0, 1), -2em 0em 0 0 rgba(0, 0, 0, 0); }
  60% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 0), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 1), -2em 0em 0 0 rgba(0, 0, 0, 1); }
  80% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 1); }`;

const tumbleLoaderStyle = css({
    color: '#000000',
    fontSize: '10px',
    margin: '2em 2em',
    position: 'relative',
    textIndent: '-9999em',
    transform: 'translateZ(0)',
    width: '2em',
    height: '2em',
    animationFillMode: 'both',
    animation: `${animationMoves} 3.5s infinite ease-in-out`,
});

export function TumbleLoader() {
    const container = React.useRef<HTMLDivElement>(null);
    return <div ref={container} className={cx(tumbleLoaderStyle, 'wegas-loader-tumble')}></div>;
}