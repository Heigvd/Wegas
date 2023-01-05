/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {css} from '@emotion/css';
import {faPlusCircle, faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import * as React from 'react';
import {Navigate} from 'react-router-dom';
import {ITokenWithId} from 'wegas-ts-api';
import {
  getRestClient,
  reloadCurrentUser,
  signInAsGuest,
  signInWithToken,
  signOut,
} from '../../API/api';
import {entityIs} from '../../API/entityHelper';
import {buildLinkWithQueryParam, getDisplayName} from '../../helper';
import useTranslations, {WegasTranslations} from '../../i18n/I18nContext';
import getLogger, {INFO} from '../../logger';
import {useCurrentUser} from '../../selectors/userSelector';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import {InlineLink} from '../common/Link';
import Loading from '../common/Loading';

const logger = getLogger('Token');
logger.setLevel(INFO);

interface TokenProps {
  accountId: number | undefined;
  hash: string;
}

function getProcessConfirmMessage(token: ITokenWithId, i18n: WegasTranslations): string {

  if (i18n.processMessages[token["@class"]]) {
    return i18n.processMessages[token["@class"]];
  } else {
    return i18n.defaultProcessMessage;
  }
}

export default function Token({accountId, hash}: TokenProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const redirectBack = `/token/${accountId || 0}/${hash}`;

  //  const location = useLocation();

  const [token, setToken] = React.useState<ITokenWithId | 'NOT_FOUND' | 'NOT_INITIALIZED'>(
    'NOT_INITIALIZED',
  );

  const [readyToProcess, setReadyToProcess] = React.useState(false);

  const {currentAccount, status: userStatus} = useCurrentUser();

  const aaiConfig = useAppSelector(state => state.auth.aaiConfig);

  // Fetch AAI config
  React.useEffect(() => {
    if (aaiConfig === 'UNKNOWN') {
      logger.info('load aai config');
      dispatch(reloadCurrentUser());
    }
  }, [aaiConfig, dispatch]);

  // Refresh current user
  React.useEffect(() => {
    if (userStatus === 'UNKNOWN') {
      logger.info('load current user');
      dispatch(reloadCurrentUser());
    }
  }, [userStatus, dispatch]);

  // Load game
  React.useEffect(() => {
    let aborted = false;
    const loadToken = async () => {
      logger.info('Load token');
      try {
        const t = await getRestClient().Token.getToken(accountId, hash);
        logger.info('Token found', t);
        if (!aborted) {
          logger.info('Set token');
          setToken(t || 'NOT_FOUND');
        }
      } catch {
        logger.info('Token not found');
        setToken('NOT_FOUND');
      }
    };
    if (token === 'NOT_INITIALIZED') {
      loadToken();
    }
    return () => {
      aborted = true;
    };
  }, [token, hash, accountId]);

  const logoutCb = React.useCallback(() => {
    dispatch(signOut());
  }, [dispatch]);

  const tokenAccountId = entityIs(token, 'Token', true)
    ? token.account != null
      ? token.account.id
      : undefined
    : undefined;
  const currentAccountId = entityIs(currentAccount, 'AbstractAccount', true)
    ? currentAccount.id
    : undefined;
  const accountType = entityIs(currentAccount, 'AbstractAccount', true)
    ? currentAccount['@class']
    : undefined;

  const processCb = React.useCallback(() => {
    if (entityIs(token, 'Token', true)) {
      getRestClient()
        .Token.processToken(token)
        .then(processedToken => {
          const redirect = processedToken.redirectTo;
          if (redirect != null) {
            window.location.href = `${APP_ENDPOINT}${redirect.startsWith("/") ? '' : '/'}${redirect}`;
          } else {
            window.location.href = `${APP_ENDPOINT}`;
          }
        });
    }
  }, [token]);

  // The ProcessToken Effect
  React.useEffect(() => {
    if (currentAccountId != null && entityIs(token, 'Token', true)) {
      if (token.autoLogin && token.account == null && accountType === 'GuestJpaAccount') {
        // token is made for guest, current user is one
        setReadyToProcess(true);
      } else if (tokenAccountId != null && tokenAccountId === currentAccountId) {
        // token is made for a specific user, and it is the current one
        setReadyToProcess(true);
      }
    }
  }, [currentAccountId, token, tokenAccountId, accountType]);

  // AutoLogin Effect
  React.useEffect(() => {
    if (userStatus === 'NOT_AUTHENTICATED' && entityIs(token, 'Token', true) && token.autoLogin) {
      if (tokenAccountId) {
        dispatch(signInWithToken({accountId: tokenAccountId, token: hash}))
          .then(result => {
            if (result.meta.requestStatus === 'rejected') {
              setToken("NOT_FOUND");
            }
          })
      } else {
        dispatch(signInAsGuest());
      }
    }
  }, [dispatch, hash, token, tokenAccountId, userStatus]);

  if (readyToProcess && entityIs(token, "Token", true) != null) {
    const msg = getProcessConfirmMessage(token as ITokenWithId, i18n);

    return <Loading animated={false}>
      <div className={css({margin: "20px"})}>
        <Button onClick={processCb} label={msg} />
      </div>
    </Loading>;
  }

  if (userStatus === 'UNKNOWN' || userStatus === 'LOADING' || token === 'NOT_INITIALIZED') {
    return <Loading>{<div>{i18n.pleaseWait}</div>}</Loading>;
  } else if (token === 'NOT_FOUND') {
    return (
      <Loading animated={false}>
        <div>{i18n.tokenNotFound}</div>
      </Loading>
    );
  } else {
    // TOKEN is known
    const autologin = token.autoLogin;
    if (currentAccount != null) {
      // authenticated
      if (autologin && tokenAccountId != null && !entityIs(currentAccount, 'GuestJpaAccount')) {
        // Such configuration implies a guest login
        // Hence, user has to log out to continue

        // ask confirmation to log out
        return (
          <Loading animated={false}>
            <div>{i18n.youAreConnectedAsUser(getDisplayName(currentAccount))}</div>
            <div>{i18n.logoutForPrivacy}</div>
            <IconButton icon={faSignOutAlt} onClick={logoutCb}>
              {i18n.logout}
            </IconButton>
          </Loading>
        );
      } else if (tokenAccountId != null && tokenAccountId != currentAccount.id) {
        // The user is not logged in with the account requested by the token.
        //
        // ask confirmation to log out
        return (
          <Loading animated={false}>
            <div>
              {i18n.youAreConnectedAsUser(getDisplayName(currentAccount))}{' '}
              {i18n.butCraftedFor(getDisplayName(token.account))}
            </div>
            <div>{i18n.logoutToContinue}</div>
            <IconButton icon={faSignOutAlt} onClick={logoutCb}>
              {i18n.logout}
            </IconButton>
          </Loading>
        );
      } else {
        return (
          <Loading>
            <div>{i18n.processing}</div>
          </Loading>
        );
      }
    }
    if (!token.autoLogin) {
      // not authenticated; no autologin
      if (token.account != null) {
        if (entityIs(token.account, 'JpaAccount')) {
          return (
            <Navigate
              to={buildLinkWithQueryParam('/SignIn', {
                redirectTo: redirectBack,
                username: token.account.email,
              })}
            />
          );
        } else if (entityIs(token.account, 'AaiAccount')) {
          if (typeof aaiConfig === 'object') {
            const url = buildLinkWithQueryParam(aaiConfig.loginUrl, {redirect: redirectBack});
            window.location.href = url;
          }
        }

        return (
          <Loading>
            <div>{i18n.pleaseWait}</div>
          </Loading>
        );
      } else {
        return (
          <Loading>
            <div>{i18n.invalidToken}</div>
          </Loading>
        );
      }
    } else {
      // token request authentication
      // user yet authenticated
      return (
        <Loading animated={false}>
          <div>
            <InlineLink to={buildLinkWithQueryParam('/SignIn', {redirectTo: redirectBack})}>
              {i18n.login}
            </InlineLink>
            {' or '}
            <InlineLink to={buildLinkWithQueryParam('/SignUp', {redirectTo: redirectBack})}>
              <FontAwesomeIcon icon={faPlusCircle} /> {i18n.createAnAccount}
            </InlineLink>
          </div>
        </Loading>
      );
    }
  }
}
