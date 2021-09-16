/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import {
  faExclamationTriangle,
  faPlay,
  faPollH,
  faRedo,
  faSpinner,
  faTrash,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { IPlayerWithId, ITeamWithId } from 'wegas-ts-api';
import {
  getGameById,
  getGameModelById,
  getRestClient,
  getTeamById,
  leaveGame,
  retryToJoinTeam,
} from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useGame, useGameModel } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card, { CardMainButton, cardSecButtonStyle } from '../common/Card';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import OpenCloseModal from '../common/OpenCloseModal';
import { cardDetailsStyle, cardTitleStyle } from '../styling/style';

interface TeamDetailsProps {
  team: ITeamWithId;
}

function TeamDetails({ team }: TeamDetailsProps): JSX.Element {
  const [extTeam, setExtTeam] = React.useState<'UNSET' | 'LOADING' | ITeamWithId>('UNSET');

  React.useEffect(() => {
    //let abort = false;
    const load = async () => {
      const extendedTeam = await getRestClient().TeamController.getEditorTeamById(team.id);
      //if (!abort) {
      setExtTeam(extendedTeam);
      //}
    };
    if (extTeam === 'UNSET') {
      setExtTeam('LOADING');
      load();
    }
    //return () => {abort = true}
  }, [extTeam, team]);

  const theTeam = typeof extTeam !== 'string' ? extTeam : team;

  return (
    <CardContainer>
      {theTeam.players.map(p => (
        <Card key={p.id} illustration="ICON_grey_user_fa">
          {extTeam === 'LOADING' || extTeam === 'UNSET' ? <InlineLoading /> : p.name}
        </Card>
      ))}
    </CardContainer>
  );
}

interface PlayerCardProps {
  player: IPlayerWithId;
  team?: ITeamWithId | 'LOADING';
}

export function computeProgressBarSize(
  initialSize: number,
  initialTime: number,
  queueSize: number,
) {
  const currentTime = new Date().getTime();

  if (initialSize > 0 || queueSize >= 0) {
    const percent = queueSize / initialSize;

    const timeToWait = Math.floor(
      (queueSize * (currentTime - initialTime)) / (initialSize - queueSize) / 1000,
    );
    return {
      waitedPercent: ((1 - percent) * 100).toFixed(),
      timeToWaitInSec: timeToWait,
    };
  } else {
    return {
      waitedPercent: 100,
      timeToWaitInSec: 0,
    };
  }
}

interface ProgressBarProps {
  initialSize: number;
  initialTime: number;
  queueSize: number;
}

function ProgressBar({ initialSize, queueSize, initialTime }: ProgressBarProps) {
  const bar = computeProgressBarSize(initialSize, initialTime, queueSize);

  return (
    <div title={`${bar.timeToWaitInSec}...`}>
      <span
        className={css({
          position: 'absolute',
          width: `${bar.waitedPercent}%`,
        })}
      ></span>
    </div>
  );
}

export default function PlayerCard({ player, team }: PlayerCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const game = useGame(team != null && team != 'LOADING' ? team.parentId : undefined);

  const gameModel = useGameModel(game != null && game != 'LOADING' ? game.parentId : undefined);

  const leaveGameCb = React.useCallback(async () => {
    return dispatch(leaveGame(player.id));
  }, [dispatch, player.id]);

  const retryCb = React.useCallback(async () => {
    return dispatch(retryToJoinTeam(player.id));
  }, [dispatch, player.id]);

  React.useEffect(() => {
    if (player.parentId != null && team == null && team !== 'LOADING') {
      // Load team !
      dispatch(getTeamById(player.parentId));
    }
  }, [player, team, dispatch]);

  React.useEffect(() => {
    if (
      team != null &&
      game == null &&
      team !== 'LOADING' &&
      game !== 'LOADING' &&
      team.parentId != null
    ) {
      // Load game
      dispatch(getGameById(team.parentId));
    }
  }, [team, game, dispatch]);

  React.useEffect(() => {
    if (
      game != null &&
      game !== 'LOADING' &&
      gameModel == null &&
      gameModel !== 'LOADING' &&
      game.parentId != null
    ) {
      // Load gameModel !
      dispatch(getGameModelById(game.parentId));
    }
  }, [game, gameModel, dispatch]);

  const [queueSize] = React.useState({
    initialQueueSize: player.queueSize || 0,
    initialQueueSizeTime: new Date().getTime(),
  });

  if (
    team != null &&
    game != null &&
    gameModel != null &&
    team != 'LOADING' &&
    game != 'LOADING' &&
    gameModel != 'LOADING'
  ) {
    const teamName = team.name ? `${i18n.Team} "${team.name}"` : i18n.Team;
    return (
      <Card illustration={gameModel.properties.iconUri}>
        <FitSpace direction="column">
          <div className={cardTitleStyle}>{game.name}</div>
          {gameModel.properties.freeForAll ? null : (
            <div className={cardDetailsStyle}>{teamName}</div>
          )}
        </FitSpace>
        {gameModel.properties.freeForAll ? null : (
          <OpenCloseModal
            icon={faUsers}
            iconTitle={i18n.viewTeam}
            title={teamName}
            illustration={gameModel.properties.iconUri}
            showCloseButton={true}
            route={`/${player.id}/team`}
          >
            {() => <TeamDetails team={team} />}
          </OpenCloseModal>
        )}

        {player.status === 'FAILED' || player.status === 'LIVE' ? (
          <ActionIconButton
            shouldConfirm
            className={cardSecButtonStyle}
            icon={faTrash}
            title={i18n.leaveGame}
            onClick={leaveGameCb}
          />
        ) : null}

        {player.status === 'FAILED' ? (
          <>
            <ActionIconButton
              className={cardSecButtonStyle}
              icon={faRedo}
              title={i18n.retryToJoin}
              onClick={retryCb}
            />
            <IconButton
              iconSize="2x"
              title={i18n.failedToJoin}
              icon={faExclamationTriangle}
              iconColor="red"
            />
          </>
        ) : null}

        {player.status === 'SURVEY' ? (
          <IconButton className={cardSecButtonStyle} icon={faPollH} />
        ) : null}

        {(player.status === 'WAITING' && (player.queueSize || 0) > 0) ||
        player.status === 'RESCHEDULED' ? (
          <ProgressBar
            initialSize={queueSize.initialQueueSize}
            initialTime={queueSize.initialQueueSizeTime}
            queueSize={player.queueSize || 0}
          />
        ) : null}

        {(player.status === 'WAITING' && (player.queueSize || 0) <= 0) ||
        player.status === 'PROCESSING' ||
        player.status === 'SEC_PROCESSING' ||
        player.status === 'DELETED' ||
        player.status === 'INITIALIZING' ? (
          <IconButton className={cardSecButtonStyle} icon={faSpinner} pulse />
        ) : null}

        {player.status === 'LIVE' ? (
          <CardMainButton
            icon={faPlay}
            title={i18n.openGameAsPlayer}
            url={`./${gameModel.uiversion === 2 ? '2/player.html' : 'game-play.html'}?id=${player.id}`}
          />
        ) : null}
      </Card>
    );
  } else {
    return (
      <Card>
        <InlineLoading />
      </Card>
    );
  }
}
