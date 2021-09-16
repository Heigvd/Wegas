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
import { IAbstractAccountWithId, IGameWithId, ITeamWithId } from 'wegas-ts-api';
import {
  getAllTeams,
  getRestClient,
  kickTeam,
  leaveGame,
  shareGame,
  unshareGame,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useTeams } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card from '../common/Card';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import Tabs, { Tab } from '../common/Tabs';
import { cardDetailsStyle, cardTitleStyle, upsideSelectStyles } from '../styling/style';

interface TeamDetailsProps {
  team: ITeamWithId;
}

/**
 * Display team & players
 */
function TeamDetails({ team }: TeamDetailsProps): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
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
  }, [extTeam, team.id]);

  const deleteTeam = React.useCallback(async () => {
    return dispatch(kickTeam(team.id));
  }, [dispatch, team.id]);

  const theTeam = typeof extTeam !== 'string' ? extTeam : team;

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
        <Card key={p.id} illustration="ICON_grey_user_fa">
          <FitSpace direction="column">
            {extTeam === 'LOADING' || extTeam === 'UNSET' ? <InlineLoading /> : p.name}
          </FitSpace>

          <ActionIconButton
            shouldConfirm="SOFT_LEFT"
            icon={faUserTimes}
            title={i18n.kickPlayer}
            onClick={async () => dispatch(leaveGame(p.id!))}
          />
        </Card>
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

function GameComposition({ game }: GameProps): JSX.Element {
  const teams = useTeams(game.id);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (teams === 'UNSET') {
      if (game.id != null) {
        dispatch(getAllTeams(game.id));
      }
    }
  }, [teams, dispatch, game.id]);

  if (typeof teams === 'string') {
    return (
      <CardContainer>
        <InlineLoading />
      </CardContainer>
    );
  } else {
    const realTeams = teams.filter(team => team != null && !entityIs(team, 'DebugTeam'));
    return (
      <CardContainer>
        {realTeams.map(team => (
          <TeamDetails key={team.id} team={team} />
        ))}
      </CardContainer>
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
            <Card key={a.id} illustration="ICON_grey_user_fa">
              <FitSpace direction="column">
                <div className={cardTitleStyle}>
                  {a.firstname} {a.lastname}
                </div>
                <div className={cardDetailsStyle}>••••@{a.emailDomain}</div>
              </FitSpace>

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
            </Card>
          ))}
        </CardContainer>
        <Flex direction="row" justify="space-between" align="center">
          <AsyncSelect
            className={css({ flexGrow: 1 })}
            onChange={inviteCb}
            placeholder={i18n.addTrainer}
            styles={upsideSelectStyles}
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
