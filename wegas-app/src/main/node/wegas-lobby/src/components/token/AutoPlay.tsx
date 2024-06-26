/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { IGameWithId, IPlayerWithId } from 'wegas-ts-api';
import {
  getGameModelById,
  getRestClient,
  joinIndividually,
  reloadCurrentUser,
  signInAsGuest,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import { buildLinkWithQueryParam } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { getLogger } from '../../logger';
import { useCurrentUser } from '../../selectors/userSelector';
import { useGameModel } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import Loading from '../common/Loading';

const logger = getLogger('AutoPlay');

interface AutoPlayProps {
  token: string;
}

export default function AutoPlay({ token }: AutoPlayProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  //  const location = useLocation();

  const [loadingMessage, setLoadingMessage] = React.useState(i18n.pleaseWait);

  const [game, setGame] = React.useState<IGameWithId | 'NOT_FOUND' | 'NOT_INITIALIZED'>(
    'NOT_INITIALIZED',
  );
  const gameModelId = entityIs(game, 'Game') ? game.parentId : undefined;

  const [player, setPlayer] = React.useState<
    IPlayerWithId | 'NOT_FOUND' | 'JOINING' | 'NOT_INITIALIZED'
  >('NOT_INITIALIZED');
  const currentUser = useCurrentUser();
  const gameModel = useGameModel(gameModelId);

  const guestAllowed = entityIs(gameModel, 'GameModel')
    ? gameModel.properties.guestAllowed
    : undefined;
  const playIndividually = entityIs(gameModel, 'GameModel')
    ? gameModel.properties.freeForAll
    : undefined;

  // Refresh current user
  React.useEffect(() => {
    if (currentUser.status === 'UNKNOWN') {
      logger.log('load current user');
      dispatch(reloadCurrentUser());
    }
  }, [currentUser.status, dispatch]);

  // fetch gameModel
  React.useEffect(() => {
    if (gameModelId != null && gameModel == null) {
      logger.log('load gameModel ', gameModelId);
      dispatch(getGameModelById({ id: gameModelId, view: 'Extended' }));
    }
  }, [gameModelId, gameModel, dispatch]);

  // Load game
  React.useEffect(() => {
    let aborted = false;
    const loadGame = async () => {
      logger.log('Load game');
      try {
        const game = await getRestClient().GameController.findByToken(token);
        logger.log('Game found', game);
        if (!aborted) {
          logger.log('Set game');
          setGame(game || 'NOT_FOUND');
        }
      } catch {
        logger.log('Game not found');
        setGame('NOT_FOUND');
      }
    };
    if (game === 'NOT_INITIALIZED') {
      loadGame();
    }
    return () => {
      aborted = true;
    };
  }, [game, token]);

  // once user is authenticated and game has been found, try to fetch existing player
  React.useEffect(() => {
    let aborted = false;
    const findPlayer = async () => {
      logger.log('Find player');
      if (entityIs(game, 'Game')) {
        try {
          const player = await getRestClient().PlayerController.getByGameId(game.id);
          logger.log('Player found', player);
          if (!aborted) {
            logger.log('Set player');
            setPlayer(player || 'NOT_FOUND');
          }
        } catch {
          logger.log('No player');
          setPlayer('NOT_FOUND');
        }
      }
    };
    if (
      entityIs(game, 'Game') &&
      player === 'NOT_INITIALIZED' &&
      currentUser.status === 'AUTHENTICATED'
    ) {
      logger.log('Try to find player');
      findPlayer();
    }
    return () => {
      aborted = true;
    };
  }, [game, currentUser.status, player]);

  // GameModel Is known, Guest are allowed and user is not authenticated => loginAsGuest
  React.useEffect(() => {
    if (guestAllowed === true && currentUser.status === 'NOT_AUTHENTICATED') {
      logger.log('Sign up as guest');
      //      setPlayer('JOINING');
      setLoadingMessage(i18n.autoplay.loginAsGuest);
      dispatch(signInAsGuest());
    }
  }, [guestAllowed, currentUser.status, dispatch, i18n.autoplay.loginAsGuest]);

  // current_user is konwn, no player and game played individually
  React.useEffect(() => {
    if (
      playIndividually === true &&
      entityIs(game, 'Game') &&
      player === 'NOT_FOUND' &&
      currentUser.status === 'AUTHENTICATED'
    ) {
      logger.log('Join individually');
      setPlayer('JOINING');
      dispatch(joinIndividually(game)).then(a => {
        if (a.meta.requestStatus === 'fulfilled') {
          // force player reload
          setPlayer('NOT_INITIALIZED');
        }
      });
    }
  }, [playIndividually, currentUser.status, game, player, dispatch]);

  if (entityIs(player, 'Player') && entityIs(gameModel, 'GameModel')) {
    //Player found => let's play
    logger.log("Player found => let's play");
    if (gameModel.uiversion === 2) {
      window.location.href = `${APP_ENDPOINT}/2/player.html?id=${player.id}`;
    } else {
      window.location.href = `${APP_ENDPOINT}/game-play.html?id=${player.id}`;
    }

    return <Loading>{loadingMessage ? <div>{loadingMessage}</div> : null}</Loading>;
  } else if (
    player === 'NOT_FOUND' &&
    playIndividually === false &&
    currentUser.status === 'AUTHENTICATED'
  ) {
    logger.log('No player, shall play in team => go to join team screen');
    return <Navigate to={`/player/join/${token}`} />;
  } else if (guestAllowed === false && currentUser.status === 'NOT_AUTHENTICATED') {
    // User not authenticated, guest are allowed
    return (
      <Loading animated={false}>
        <div>
          please{' '}
          <NavLink to={buildLinkWithQueryParam('/SignIn', { redirectTo: `/play/${token}` })}>
            {i18n.login}
          </NavLink>
          {' or '}
          <NavLink to={buildLinkWithQueryParam('/SignUp', { redirectTo: `/play/${token}` })}>
            {i18n.createAnAccount}
          </NavLink>
        </div>
      </Loading>
    );
  } else if (game === 'NOT_FOUND') {
    return (
      <Loading>
        <div>game not found</div>
      </Loading>
    );
  } else if (
    game === 'NOT_INITIALIZED' ||
    currentUser.status === 'UNKNOWN' ||
    player == 'NOT_INITIALIZED'
  ) {
    return <Loading>{loadingMessage ? <div>{loadingMessage}</div> : null}</Loading>;
  } else {
    return (
      <Loading animated={false}>{loadingMessage ? <div>{loadingMessage}</div> : null}</Loading>
    );
  }
}
