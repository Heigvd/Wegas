/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faSync, faTrash, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import AsyncSelect from 'react-select/async';
import {
  IAbstractAccountWithId,
  IGameWithId,
  IPlayer,
  ITeam,
} from 'wegas-ts-api';
import {
  getRestClient,
  kickTeam,
  leaveGame,
  updateGame,
  shareGame,
  unshareGame,
  getGameById,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useGame } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card from '../common/Card';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import { userIllu, verifiedIllu } from '../common/illustrations/illustrationHelper';
import InlineLoading from '../common/InlineLoading';
import Tabs, { Tab } from '../common/Tabs';
import Toggler from '../common/Toggler';
import { TeamCreator } from '../player/JoinGame';
import {
  cardDetailsStyle,
  cardFooterPadding,
  cardTitleStyle,
  defaultSelectStyles,
} from '../styling/style';


function PlayerDetails(player : IPlayer) {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  const verified = entityIs(player, 'Player') ? player.verifiedId : false;
  const org = entityIs(player, 'Player') ? player.homeOrg : false;

  const playerName = entityIs(player, 'Player') ? player.name : <InlineLoading />;

  return (
    <Card
      title={org ? i18n.verified(org) : undefined}
      illustration={verified ? verifiedIllu : userIllu}
    >
      <FitSpace direction="column">{playerName}</FitSpace>

      <ActionIconButton
        shouldConfirm="SOFT_LEFT"
        icon={faUserTimes}
        title={i18n.kickPlayer}
        onClick={async () => dispatch(leaveGame(player.id!))}
      />
    </Card>
  );
}

/**
 * Display team & players
 */
function TeamDetails(team : ITeam): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  const deleteTeam = React.useCallback(async () => {
    return dispatch(kickTeam(team.id!));
  }, [dispatch, team.id]);

  const theTeam = team;
  const teamName = team.name ? `${i18n.Team} "${team.name}"` : i18n.Team;

  return (
    <div className={css({ padding: '10px' })}>
      <Flex direction="row" align="center">
        <h4>{teamName}</h4>
        <ActionIconButton
          shouldConfirm="SOFT_CENTER"
          title={i18n.kickTeam}
          icon={faTrash}
          onClick={deleteTeam}
        />
      </Flex>
      {theTeam.players.map(p => (
        <PlayerDetails key={p.id} {...p}/>
      ))}
      {theTeam.players.length === 0 ? (
        <i className={css({ marginLeft: '10px' })}>{i18n.teamIsEmpty}</i>
      ) : null}
    </div>
  );
}

interface GameProps {
  game: IGameWithId;
}

function fullGameLoadRequired(gameData: IGameWithId | 'LOADING' | undefined): boolean {
  if(!gameData)
    return true;
  if(gameData === 'LOADING')
    return false;
  if(!gameData.teams)
    return true;
  // a test player is always present
  // test that we have a full data object
  const testTeam = gameData.teams[0];
  return (!testTeam || ! testTeam.players[0]?.name) ? true : false;
}

function GameComposition({ game }: GameProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const playersCanCreate = !game.preventPlayerCreatingTeams;
  const playersCanLeave = !game.preventPlayerLeavingTeam;

  const fullGameData = useGame(game.id);

  React.useEffect(() => {
    if (fullGameLoadRequired(fullGameData)) {
      if (game.id != null) {
        // Editor view fetches the full data including teams and player names
        dispatch(getGameById({id: game.id, view: 'Editor'}));
      }
    }
  }, [fullGameData, dispatch, game.id]);

  if (fullGameData === undefined || fullGameData === 'LOADING' || fullGameLoadRequired(fullGameData)){
    return (
      <CardContainer>
        <InlineLoading />
      </CardContainer>
    );
  } else {
    const realTeams = fullGameData.teams.filter(team => team != null && !entityIs(team, 'DebugTeam'));
    return (
      <FitSpace direction="column" overflow="auto">
        <CardContainer>
          {realTeams.map(team => (
            <TeamDetails key={team.id} {...team} />
          ))}
        </CardContainer>
        <Flex className={css({ padding: '10px 10px 0px 10px', gap: "15px" })}>
          <Toggler
            title={playersCanCreate ? i18n.playersCanCreateTeams : i18n.playersCantCreateTeams}
            label={playersCanCreate ? i18n.playersCanCreateTeams : i18n.playersCantCreateTeams}
            value={playersCanCreate}
            onChange={() => {
              dispatch(updateGame({ ...game, preventPlayerCreatingTeams: playersCanCreate }));
            }}
          />
          <Toggler
            title={playersCanLeave ? i18n.playersCanLeaveTeams : i18n.playersCantLeaveTeams}
            label={playersCanLeave ? i18n.playersCanLeaveTeams : i18n.playersCantLeaveTeams}
            value={playersCanLeave}
            onChange={() => {
              dispatch(updateGame({...game, preventPlayerLeavingTeam: playersCanLeave }));
            }}
          />
        </Flex>
        <TeamCreator game={game} hideAfterCreation={false} />
      </FitSpace>
    );
  }
}

function ShareGame({ game }: GameProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [trainers, setTrainers] = React.useState<'UNSET' | 'LOADING' | IAbstractAccountWithId[]>(
    'UNSET',
  );

  React.useEffect(() => {
    //let abort = false;
    const load = async () => {
      const t = await getRestClient().GameController.findTrainers(game.id);
      //if (!abort) {
      setTrainers(
        t.flatMap(u => {
          if (u.accounts != null) {
            return [u.accounts[0]];
          } else {
            return [];
          }
        }),
      );
    };
    if (trainers === 'UNSET') {
      setTrainers('LOADING');
      load();
    }
    //return () => {abort = true}
  }, [trainers, game]);

  const promiseOptions = async (inputValue: string) => {
    if (inputValue.length < 3) {
      return [];
    } else {
      const result = await getRestClient().UserController.autoComplete(inputValue, [
        'Trainer',
        'Scenarist',
        'Administrator',
      ]);
      return result.map(account => {
        return {
          value: account.id,
          label: `${account.firstname} ${account.lastname} (@${account.emailDomain})`,
        };
      });
    }
  };

  const inviteCb = React.useCallback(
    (option: { value: number } | null) => {
      if (option != null) {
        dispatch(
          shareGame({
            gameId: game.id,
            accountId: option.value,
          }),
        ).then(() => setTrainers('UNSET'));
      }
    },
    [dispatch, game.id],
  );

  if (typeof trainers === 'string') {
    return <InlineLoading />;
  } else {
    return (
      <FitSpace direction="column">
        <CardContainer>
          {trainers.map(a => (
            <Card key={a.id} illustration={a.verified ? verifiedIllu : userIllu}>
              <FitSpace direction="column">
                <div className={cardTitleStyle}>
                  {a.firstname} {a.lastname}
                </div>
                <div className={cardDetailsStyle}>••••@{a.emailDomain}</div>
              </FitSpace>

              {trainers.length > 1 ? (
                <ActionIconButton
                  shouldConfirm="SOFT_LEFT"
                  icon={faUserTimes}
                  title={i18n.kickTrainer}
                  onClick={async () =>
                    dispatch(unshareGame({ gameId: game.id, accountId: a.id })).then(() =>
                      setTrainers('UNSET'),
                    )
                  }
                />
              ) : null}
            </Card>
          ))}
        </CardContainer>
        <Flex className={cardFooterPadding} direction="row" justify="space-between" align="center">
          <AsyncSelect
            className={css({ flexGrow: 1 })}
            onChange={inviteCb}
            placeholder={i18n.addTrainer}
            menuPlacement="top"
            style={defaultSelectStyles}
            cacheOptions
            defaultOptions
            loadOptions={promiseOptions}
          />
          <IconButton
            icon={faSync}
            onClick={() => {
              setTrainers('UNSET');
            }}
          />
        </Flex>
      </FitSpace>
    );
  }
}

export function GameUsers({ game }: GameProps): JSX.Element {
  const i18n = useTranslations();

  return (
    <Tabs>
      <Tab name="teams" label={i18n.teams}>
        <GameComposition game={game} />
      </Tab>
      <Tab name="trainers" label={i18n.trainers}>
        <ShareGame game={game} />
      </Tab>
    </Tabs>
  );
}

