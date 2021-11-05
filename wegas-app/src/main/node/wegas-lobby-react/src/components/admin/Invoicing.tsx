/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import {
  faBan,
  faCommentDots,
  faExclamationTriangle,
  faMoneyBillWave,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IGameAdmin } from 'wegas-ts-api';
import * as API from '../../API/api';
import { IGameAdminWithTeams } from '../../API/restClient';
import { match } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import Button from '../common/Button';
import Card from '../common/Card';
import CardContainer, { WindowedContainer } from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import DropDownMenu, { itemStyle } from '../common/DropDownMenu';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import Form, { Field } from '../common/Form';
import IconButton, { LayeredIconButton } from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import OpenCloseModal from '../common/OpenCloseModal';
import SortBy, { SortByOption } from '../common/SortBy';
import {
  cardDetailsStyle,
  cardSubDetailsStyle,
  cardTitleStyle,
  mainButtonStyle,
  panelPadding,
} from '../styling/style';

interface GameAdminModalProps {
  gameAdmin: IGameAdminWithTeams;
  close: () => void;
}

function getDeclaredCount(gameAdmin: IGameAdminWithTeams) {
  return (gameAdmin.teams || []).reduce((acc, cur) => {
    if (cur.declaredSize) {
      return acc + cur.declaredSize;
    } else {
      return acc;
    }
  }, 0);
}

function getEffectiveCount(gameAdmin: IGameAdminWithTeams) {
  return (gameAdmin.teams || []).reduce((acc, t) => {
    return acc + (t.players || []).length;
  }, 0);
}

function GameAdminDetails({ gameAdmin, close }: GameAdminModalProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [state, setState] = React.useState(gameAdmin);

  const onSaveCb = React.useCallback(() => {
    if (state.comments !== gameAdmin.comments) {
      dispatch(API.updateAdminGame(state)).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          close();
        }
      });
    } else {
      close();
    }
  }, [state, close, dispatch, gameAdmin.comments]);

  const fields: Field<IGameAdmin>[] = [
    {
      key: 'comments',
      type: 'textarea',
      label: i18n.comments,
      isMandatory: false,
    },
  ];

  return (
    <CardContainer>
      <FitSpace direction="column">
        <Form value={gameAdmin} onSubmit={setState} fields={fields} autoSubmit={true} />
      </FitSpace>
      <Flex justify="space-between" align="center">
        <div className={css({ margin: '10px', color: 'var(--warningColor)' })}>
          {gameAdmin.comments != state.comments ? (
            <>
              <FontAwesomeIcon icon={faExclamationTriangle} /> {i18n.pendingChanges}{' '}
            </>
          ) : null}
        </div>
        <Button className={mainButtonStyle} label={i18n.save} onClick={onSaveCb} />
      </Flex>
    </CardContainer>
  );
}

function GameAdminUsers({ gameAdmin }: GameAdminCardProps): JSX.Element {
  const i18n = useTranslations();

  const declared = getDeclaredCount(gameAdmin);
  const effective = getEffectiveCount(gameAdmin);

  return (
    <CardContainer>
      {(gameAdmin.teams || []).length === 0 ? (
        <h3>{i18n.emptyGame}</h3>
      ) : (
        <h3>{`${declared} ${i18n.declared}; ${effective} ${i18n.effective}`}</h3>
      )}
      {(gameAdmin.teams || []).map((team, i) => {
        const count = (team.players || []).length;
        return (
          <div key={i}>
            <h4>{`${i18n.Team} "${team.name}" (${team.declaredSize} ${i18n.declared}; ${count} ${i18n.effective})`}</h4>
            <ul>
              {team.players && team.players.length > 0 ? (
                team.players.map((p, i) => <li key={i}>{`${p.name} (${p.status})`}</li>)
              ) : (
                <li>
                  <i>{i18n.emptyTeam}</i>
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </CardContainer>
  );
}

interface GameAdminCardProps {
  gameAdmin: IGameAdminWithTeams;
}

const hoverStyle = css({
  color: 'lightgrey',
  ':hover': {
    color: 'grey',
  },
});

function GameAdminCard({ gameAdmin }: GameAdminCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const declaredSize = getDeclaredCount(gameAdmin);

  const allPlayersCount = getEffectiveCount(gameAdmin);

  const countDiff = Math.abs(allPlayersCount - declaredSize);

  const setStatusTodo = React.useCallback(() => {
    if (gameAdmin.status !== 'TODO') {
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'TODO' }));
    }
  }, [gameAdmin, dispatch]);

  const setStatusCharged = React.useCallback(() => {
    if (gameAdmin.status !== 'CHARGED') {
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'CHARGED' }));
    }
  }, [gameAdmin, dispatch]);

  const setStatusProcessed = React.useCallback(() => {
    if (gameAdmin.status !== 'PROCESSED') {
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'PROCESSED' }));
    }
  }, [gameAdmin, dispatch]);

  const chargedIcon = React.useMemo(() => {
    if (gameAdmin.status !== 'CHARGED') {
      return (
        <IconButton
          className={hoverStyle}
          title={i18n.invoiceCharged}
          icon={faMoneyBillWave}
          onClick={setStatusCharged}
        />
      );
    } else {
      return (
        <IconButton title={i18n.invoiceCharged} icon={faMoneyBillWave} onClick={setStatusTodo} />
      );
    }
  }, [gameAdmin.status, setStatusTodo, setStatusCharged, i18n.invoiceCharged]);

  const processedIcon = React.useMemo(() => {
    if (gameAdmin.status !== 'PROCESSED') {
      return (
        <LayeredIconButton
          className={hoverStyle}
          title={i18n.invoiceFree}
          icons={[{ icon: faMoneyBillWave }, { icon: faBan, transform: 'grow-20' }]}
          onClick={setStatusProcessed}
        />
      );
    } else {
      return (
        <LayeredIconButton
          title={i18n.invoiceFree}
          icons={[{ icon: faMoneyBillWave }, { icon: faBan, transform: 'grow-20' }]}
          onClick={setStatusTodo}
        />
      );
    }
  }, [gameAdmin.status, setStatusProcessed, setStatusTodo, i18n.invoiceFree]);

  return (
    <Card size="MEDIUM" illustration="ICON_grey_receipt_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>
          {gameAdmin.gameName || ''} [{i18n.status[gameAdmin.gameStatus || 'LIVE']}]
        </div>
        <div className={cardDetailsStyle}>
          {`${i18n.createdOn} "${i18n.formatDate(gameAdmin.createdTime || 0)}" ${i18n.by} ${
            gameAdmin.creator
          }`}
        </div>
        <div
          className={cardDetailsStyle}
        >{`${i18n.basedOnScenario} "${gameAdmin.gameModelName}"`}</div>
        {gameAdmin.comments ? (
          <div className={cardSubDetailsStyle}>{gameAdmin.comments}</div>
        ) : null}
      </FitSpace>

      {countDiff > 1 && countDiff < 4 ? (
        <FontAwesomeIcon
          title={i18n.countMismatch(declaredSize, allPlayersCount)}
          icon={faExclamationTriangle}
          color="orange"
        />
      ) : null}
      {countDiff > 4 ? (
        <FontAwesomeIcon
          title={i18n.countMismatch(declaredSize, allPlayersCount)}
          icon={faExclamationTriangle}
          color="red"
        />
      ) : null}

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.viewTeam}
        title={gameAdmin.gameName || ''}
        illustration="ICON_grey_receipt_fa"
        showCloseButton={true}
        route={`/${gameAdmin.id}/users`}
      >
        {() => <GameAdminUsers gameAdmin={gameAdmin} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faCommentDots}
        iconTitle={i18n.settings}
        title={gameAdmin.gameName || ''}
        illustration="ICON_grey_receipt_fa"
        showCloseButton={true}
        route={`/${gameAdmin.id}/settings`}
      >
        {close => <GameAdminDetails gameAdmin={gameAdmin} close={close} />}
      </OpenCloseModal>

      {processedIcon}
      {chargedIcon}
    </Card>
  );
}

const matchSearch = (search: string) => (data: IGameAdmin) => {
  return match(search, regex => {
    return (
      (data.creator != null && data.creator.match(regex) != null) ||
      (data.gameName != null && data.gameName.match(regex) != null) ||
      (data.comments != null && data.comments.match(regex) != null) ||
      (data.gameModelName != null && data.gameModelName.match(regex) != null)
    );
  });
};

export default function Invoicing(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [statusFilter, setStatusFilter] = React.useState<NonNullable<IGameAdmin['status']>>('TODO');

  const { gameAdmins, status } = useAppSelector(
    state => {
      return {
        gameAdmins: Object.values(state.invoices.games).filter(ga => ga.status === statusFilter),
        status: state.invoices.status,
      };
    },
    (a, b) => shallowEqual(a.gameAdmins, b.gameAdmins) && shallowEqual(a.status, b.status),
  );

  React.useEffect(() => {
    if (status['TODO'] === 'NOT_INITIALIZED' && statusFilter === 'TODO') {
      dispatch(API.getAdminGames('TODO'));
    }

    if (status['PROCESSED'] === 'NOT_INITIALIZED' && statusFilter === 'PROCESSED') {
      dispatch(API.getAdminGames('PROCESSED'));
    }

    if (status['CHARGED'] === 'NOT_INITIALIZED' && statusFilter === 'CHARGED') {
      dispatch(API.getAdminGames('CHARGED'));
    }
  }, [status, statusFilter, dispatch]);

  const [sortBy, setSortBy] = React.useState<{ key: keyof IGameAdmin; asc: boolean }>({
    key: 'createdTime',
    asc: false,
  });

  const sortOptions: SortByOption<IGameAdmin>[] = [
    { key: 'createdTime', label: i18n.createdOn },
    { key: 'creator', label: i18n.createdBy },
    { key: 'gameModelName', label: i18n.scenario },
  ];

  const onSortChange = React.useCallback(
    ({ key, asc }: { key: keyof IGameAdmin; asc: boolean }) => {
      setSortBy({ key, asc });
    },
    [],
  );

  const [filter, setFilter] = React.useState('');

  const createCardCb = React.useCallback(
    (ga: IGameAdminWithTeams) => <GameAdminCard key={ga.id} gameAdmin={ga} />,
    [],
  );

  const notReady = status[statusFilter] != 'READY';

  if (notReady) {
    return (
      <div>
        <h3>{i18n.invoicing}</h3>
        <InlineLoading />
      </div>
    );
  } else {
    const filtered = filter ? gameAdmins.filter(matchSearch(filter)) : gameAdmins;

    const sorted = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'createdTime') {
        return reverse * ((a.createdTime || 0) - (b.createdTime || 0));
      } else if (sortBy.key === 'creator') {
        return reverse * (a.creator || '').localeCompare(b.creator || '');
      } else if (sortBy.key === 'gameModelName') {
        return reverse * (a.gameModelName || '').localeCompare(b.gameModelName || '');
      } else {
        return 0;
      }
    });

    const filterEntries: { value: NonNullable<IGameAdmin['status']>; label: React.ReactNode }[] = [
      {
        value: 'TODO',
        label: <div className={itemStyle}>{i18n.invoiceTodo}</div>,
      },
      { value: 'PROCESSED', label: <div className={itemStyle}>{i18n.invoiceFree}</div> },
      { value: 'CHARGED', label: <div className={itemStyle}>{i18n.invoiceCharged}</div> },
    ];

    return (
      <FitSpace
        direction="column"
        overflow="auto"
        className={cx(panelPadding, css({ position: 'relative' }))}
      >
        <Flex
          justify="space-between"
          align="center"
          className={css({
            flexShrink: 0,
            height: '80px',
          })}
        >
          <h3>{i18n.invoicing}</h3>
          <SortBy options={sortOptions} current={sortBy} onChange={onSortChange} />
          <DropDownMenu
            menuIcon="CARET"
            entries={filterEntries}
            value={statusFilter}
            onSelect={setStatusFilter}
          />
          <DebouncedInput
            size="SMALL"
            value={filter}
            placeholder={i18n.search}
            onChange={setFilter}
          />
        </Flex>

        <WindowedContainer
          items={sorted}
          emptyMessage={<i>{filter ? i18n.noGamesFound : i18n.noGames}</i>}
        >
          {createCardCb}
        </WindowedContainer>
      </FitSpace>
    );
  }
}
