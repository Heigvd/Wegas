/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import Select from 'react-select';
import { IGameModelWithId, IGameWithId, ITeam, ITeamWithId } from 'wegas-ts-api';
import {
  createTeam,
  findGameByToken,
  getAllTeams,
  joinIndividually,
  joinTeam,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useTeams, useUserPlayerInGame } from '../../selectors/wegasSelector';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addNotification } from '../../store/slices/notification';
import { CHANNEL_PREFIX, useWebsocketChannel } from '../../websocket/websocket';
import ActionButton from '../common/ActionButton';
import Button from '../common/Button';
import Card, { CardMainButton } from '../common/Card';
import { WindowedContainer } from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
//import Modal from '../common/Modal';
import Input from '../common/Input';
import {
  cardTitleStyle,
  defaultSelectStyles,
  mainButtonStyle,
  secButtonStyle,
} from '../styling/style';

interface Option {
  value: string;
  label: string;
  color?: string;
  isDisabled?: boolean;
  isFixed?: boolean;
}

const sizeOptions = ((x: number) => {
  const opts: Option[] = [];
  for (let i = 1; i <= x; i++) {
    opts.push({ value: `${i}`, label: `${i}` });
  }
  return opts;
})(10);

function TeamCreator({ game }: { game: IGameWithId }): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const [team, setTeam] = React.useState<ITeam>({ '@class': 'Team', players: [] });
  const [visible, setVisible] = React.useState(true);

  const setName = React.useCallback((teamName: string) => {
    setTeam(team => ({ ...team, name: teamName }));
  }, []);
  const setSize = React.useCallback((option: { value: string } | null) => {
    setTeam(team => ({ ...team, declaredSize: option ? +option.value : undefined }));
  }, []);

  const createCb = React.useCallback(async () => {
    return dispatch(createTeam({ game, team })).then(action => {
      if (action.meta.requestStatus === 'fulfilled') {
        setVisible(false);
      }
    });
  }, [game, team, dispatch]);

  if (visible) {
    return (
      <Flex
        direction="row"
        align="center"
        className={css({
          padding: '10px',
        })}
      >
        <FitSpace direction="column">
          <Input placeholder={i18n.teamName} onChange={setName} value={team.name || ''} />
        </FitSpace>
        <Select
          placeholder={i18n.teamSize}
          styles={{
            ...defaultSelectStyles,
            control: provided => ({
              ...provided,
              height: '50px',
              marginTop: '1px',
            }),
          }}
          options={sizeOptions}
          onChange={setSize}
        />
        <ActionButton
          label={i18n.createTeam}
          onClick={
            team.name != null &&
            team.name.length > 0 &&
            team.declaredSize != null &&
            team.declaredSize > 0
              ? createCb
              : undefined
          }
        />
      </Flex>
    );
  } else {
    return <></>;
  }
}
interface TeamToJoinCardProps {
  team: ITeamWithId;
  closePanel: () => void;
}

function TeamToJoinCard({ team, closePanel }: TeamToJoinCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const joinCb = React.useCallback(async () => {
    return dispatch(joinTeam(team.id)).then(() => {
      closePanel();
    });
  }, [team.id, dispatch, closePanel]);

  return (
    <Card illustration="ICON_grey_users_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{team.name}</div>
      </FitSpace>
      <ActionButton className={secButtonStyle} label={i18n.joinTeam} onClick={joinCb} />
    </Card>
  );
}

interface ShowTeamsProps {
  game: IGameWithId;
  closePanel: () => void;
}

function ShowTeams({ closePanel, game }: ShowTeamsProps): JSX.Element {
  const teams = useTeams(game.id);
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  useWebsocketChannel(`${CHANNEL_PREFIX.Game}${game.id}`);

  React.useEffect(() => {
    if (teams === 'UNSET') {
      if (game.id != null) {
        dispatch(getAllTeams(game.id));
      }
    }
  }, [teams, dispatch, game.id]);

  return (
    <FitSpace className={css({ width: '80%' })} direction="column" overflow="auto">
      {typeof teams === 'string' ? (
        <InlineLoading />
      ) : (
        <>
          <span>{i18n.joinOrCreateATeam}</span>
          <WindowedContainer
            gradientHeight={100}
            bgColor="var(--bgColor)"
            grow={0}
            items={teams.filter(t => !entityIs(t, 'DebugTeam'))}
          >
            {t => <TeamToJoinCard key={t.id} closePanel={closePanel} team={t} />}
          </WindowedContainer>
        </>
      )}
      <TeamCreator game={game} />
    </FitSpace>
  );
}

interface GameAndGm {
  game: IGameWithId;
  gameModel: IGameModelWithId;
}

interface LoadProps {
  onCancel: () => void;
  onSelect: (data: GameAndGm) => void;
}

export function FindGameByToken({ onSelect, onCancel }: LoadProps): JSX.Element {
  const [key, setKey] = React.useState('');

  const i18n = useTranslations();

  const dispatch = useAppDispatch();

  const onJoin = React.useCallback(async () => {
    return dispatch(findGameByToken(key)).then(action => {
      if (action.meta.requestStatus === 'fulfilled') {
        onSelect(action.payload as GameAndGm);
      } else if (action.meta.requestStatus === 'rejected') {
        dispatch(addNotification({ status: 'OPEN', type: 'ERROR', message: i18n.gameNotFound }));
      }
    });
  }, [key, dispatch, i18n.gameNotFound, onSelect]);

  return (
    <FitSpace direction="column">
      <h3>{i18n.joinGame}</h3>
      <Input
        placeholder={i18n.accessKey}
        className={css({ minWidth: '400px', paddingBottom: '20px' })}
        value={key}
        onChange={setKey}
      />
      <Flex justify="flex-end">
        <Button label={i18n.cancel} onClick={onCancel} />
        <ActionButton
          className={mainButtonStyle}
          label={i18n.join}
          onClick={key.length > 0 ? onJoin : undefined}
        />
      </Flex>
    </FitSpace>
  );
}

interface JoinGameProps {
  onClose: () => void;
  gameToken?: string;
}

export default function JoinGame({ gameToken, onClose }: JoinGameProps): JSX.Element {
  const i18n = useTranslations();

  const [data, setData] = React.useState<GameAndGm | undefined>();
  const [tokenState, setToken] = React.useState(gameToken);

  const game = data ? data.game : undefined;
  const gameModel = data ? data.gameModel : undefined;

  const { currentUserId } = useCurrentUser();

  const dispatch = useAppDispatch();

  const existingPlayer = useUserPlayerInGame(game != null ? game.id : undefined, currentUserId);

  const joinStatus = useAppSelector(state => {
    if (game != null) {
      return state.games.joinStatus[game.id];
    } else {
      return undefined;
    }
  });

  React.useEffect(() => {
    if (game != null && gameModel != null && joinStatus == undefined && existingPlayer == null) {
      if (gameModel.properties.freeForAll) {
        dispatch(joinIndividually(game)).then(() => {
          onClose();
        });
      }
    }
  }, [game, gameModel, onClose, dispatch, joinStatus]);

  React.useEffect(() => {
    if (gameToken != null) {
      dispatch(findGameByToken(gameToken)).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          setData(action.payload as GameAndGm);
          setToken(undefined);
        } else if (action.meta.requestStatus === 'rejected') {
          dispatch(addNotification({ status: 'OPEN', type: 'ERROR', message: i18n.gameNotFound }));
          setToken(undefined);
        }
      });
    }
  }, [gameToken, dispatch, i18n.gameNotFound]);

  if (tokenState != null) {
    return <InlineLoading />;
  } else if (gameModel == null || game == null) {
    return <FindGameByToken onSelect={setData} onCancel={onClose} />;
  } else if (existingPlayer != null) {
    if (existingPlayer.status === 'LIVE') {
      return (
        <Flex direction="column" justify="center" align="center" grow={1}>
          <div className={css({ padding: '10px' })}>{i18n.alreadyJoined}</div>
          <CardMainButton
            icon={faPlay}
            title={i18n.openGameAsPlayer}
            url={`./${gameModel.uiversion === 2 ? '2/player.html' : 'game-play.html'}?id=${
              existingPlayer.id
            }`}
          />
        </Flex>
      );
    } else {
      return <InlineLoading />;
    }
  } else if (gameModel.properties.freeForAll) {
    return <InlineLoading />;
  } else {
    return <ShowTeams closePanel={onClose} game={game} />;
  }
}

//      <Modal title={game.name || 'Game'} onClose={onClose} illustration={gameModel.properties.iconUri} showCloseButton={true} >
//      </Modal>
