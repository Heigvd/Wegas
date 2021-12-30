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
  faFileExcel,
  faMoneyBillWave,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
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
import { cardSubDetailsStyle, mainButtonStyle, panelPadding } from '../styling/style';

interface GameAdminModalProps {
  gameAdmin: IGameAdminWithTeams;
  close: () => void;
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

  const fields: Field<IGameAdminWithTeams>[] = [
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

function GameAdminUsers({ gameAdmin }: GameAdminModalProps): JSX.Element {
  const i18n = useTranslations();

  return (
    <CardContainer>
      {(gameAdmin.teams || []).length === 0 ? (
        <h3>{i18n.emptyGame}</h3>
      ) : (
        <h3>
          {' '}
          {`${gameAdmin.effectiveCount} ${i18n.effective} ; ${gameAdmin.declaredCount} ${i18n.declared} `}
        </h3>
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
  sortKey: keyof IGameAdminWithTeams;
  touch: (ga: IGameAdminWithTeams) => void;
}

const hoverStyle = css({
  color: 'lightgrey',
  ':hover': {
    color: 'grey',
  },
});

const attentionStyle = (diff: number) => {
  if (diff <= 1) {
    return css({ visibility: 'hidden' });
  } else if (diff < 5) {
    return css({ color: 'var(--warningColor)' });
  } else {
    return css({ color: 'var(--errorColor)' });
  }
};

const shortCellStyle = css({
  flexGrow: 1,
  flexBasis: '10px',
  padding: '0 10px',
});

const cellStyle = css({
  //  width: 'min-content',
  flexBasis: '10px',
  flexGrow: 4,
  padding: '0 10px',
});

const sortedBy = css({ fontWeight: 550 });

function GameAdminCard({ gameAdmin, sortKey, touch }: GameAdminCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const declaredCount = gameAdmin.declaredCount;

  const effectiveCount = gameAdmin.effectiveCount;

  const countDiff = gameAdmin.diff;

  const setStatusTodo = React.useCallback(() => {
    if (gameAdmin.status !== 'TODO') {
      touch(gameAdmin);
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'TODO' }));
    }
  }, [gameAdmin, dispatch, touch]);

  const setStatusCharged = React.useCallback(() => {
    if (gameAdmin.status !== 'CHARGED') {
      touch(gameAdmin);
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'CHARGED' }));
    }
  }, [gameAdmin, dispatch, touch]);

  const setStatusProcessed = React.useCallback(() => {
    if (gameAdmin.status !== 'PROCESSED') {
      touch(gameAdmin);
      dispatch(API.updateAdminGame({ ...gameAdmin, status: 'PROCESSED' }));
    }
  }, [gameAdmin, dispatch, touch]);

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
      <FitSpace direction="column" justify="space-between">
        <FitSpace direction="row" justify="space-between" align="center">
          <div className={cx(shortCellStyle, { [sortedBy]: sortKey === 'createdTime' })}>
            {i18n.formatDate(gameAdmin.createdTime || 0)}
          </div>
          <div className={cx(cellStyle, { [sortedBy]: sortKey === 'creator' })}>
            {gameAdmin.creator}
          </div>
          <div className={cx(cellStyle, { [sortedBy]: sortKey === 'gameModelName' })}>
            {gameAdmin.gameModelName}
          </div>
          <div className={cx(cellStyle, { [sortedBy]: sortKey === 'gameName' })}>
            {gameAdmin.gameName || ''}
          </div>
          <div className={cx(shortCellStyle, { [sortedBy]: sortKey === 'status' })}>
            {i18n.status[gameAdmin.gameStatus || 'LIVE']}
          </div>

          <div className={cx(shortCellStyle, { [sortedBy]: sortKey === 'effectiveCount' })}>
            {gameAdmin.effectiveCount}
          </div>
          <div className={cx(shortCellStyle, { [sortedBy]: sortKey === 'declaredCount' })}>
            {gameAdmin.declaredCount}
          </div>
        </FitSpace>
        {gameAdmin.comments ? (
          <div className={cardSubDetailsStyle}>{gameAdmin.comments}</div>
        ) : null}
      </FitSpace>

      <FontAwesomeIcon
        className={attentionStyle(countDiff)}
        title={i18n.countMismatch(declaredCount, effectiveCount)}
        icon={faExclamationTriangle}
      />

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.viewTeam}
        title={gameAdmin.gameName || ''}
        illustration="ICON_grey_receipt_fa"
        showCloseButton={true}
        route={`/${gameAdmin.id}/users`}
      >
        {close => <GameAdminUsers gameAdmin={gameAdmin} close={close} />}
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

const matchSearch = (search: string) => (data: IGameAdminWithTeams) => {
  return match(search, regex => {
    return (
      (data.creator != null && data.creator.match(regex) != null) ||
      (data.gameName != null && data.gameName.match(regex) != null) ||
      (data.comments != null && data.comments.match(regex) != null) ||
      (data.gameModelName != null && data.gameModelName.match(regex) != null)
    );
  });
};

const fullWidthHack = css({
  position: 'fixed',
  display: 'flex',
  top: '200px',
  left: 0,
  right: 0,
  bottom: 0,
});

function encodeCsvCell(content: string | number | null | undefined): string {
  const toStr = `${content}`;
  return `"${toStr.replace('"', '')}"`;
}

export default function Invoicing(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [statusFilter, setStatusFilter] =
    React.useState<NonNullable<IGameAdminWithTeams['status']>>('TODO');

  const setStatusFilterCb = React.useCallback((s: NonNullable<IGameAdminWithTeams['status']>) => {
    setStatusFilter(s);
    setTouched([]);
  }, []);

  // keep references to just updated games
  const [touched, setTouched] = React.useState<number[]>([]);

  const { gameAdmins, status } = useAppSelector(
    state => {
      return {
        gameAdmins: Object.values(state.invoices.games).filter(
          ga => ga.status === statusFilter || touched.includes(ga.id),
        ),
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

  const [sortBy, setSortBy] = React.useState<{ key: keyof IGameAdminWithTeams; asc: boolean }>({
    key: 'createdTime',
    asc: false,
  });

  const sortOptions: SortByOption<IGameAdminWithTeams>[] = [
    { key: 'gameModelName', label: i18n.scenario },
    { key: 'creator', label: i18n.createdBy },
    { key: 'createdTime', label: i18n.createdOn },
    { key: 'declaredCount', label: i18n.declared },
    { key: 'effectiveCount', label: i18n.effective },
    { key: 'diff', label: i18n.invoiceDiff },
    { key: 'gameStatus', label: 'game status' },
  ];

  const onSortChange = React.useCallback(
    ({ key, asc }: { key: keyof IGameAdminWithTeams; asc: boolean }) => {
      setSortBy({ key, asc });
    },
    [],
  );

  const [filter, setFilter] = React.useState('');

  const onTouch = React.useCallback((ga: IGameAdminWithTeams) => {
    setTouched(state => {
      if (!state.includes(ga.id)) {
        return [...state, ga.id];
      }
      return state;
    });
  }, []);

  const createCardCb = React.useCallback(
    (ga: IGameAdminWithTeams) => (
      <GameAdminCard key={ga.id} gameAdmin={ga} sortKey={sortBy.key} touch={onTouch} />
    ),
    [sortBy.key, onTouch],
  );

  const notReady = status[statusFilter] != 'READY';

  const toCsv = React.useCallback(
    (games: IGameAdminWithTeams[]) => {
      const headers = 'date, by, Scenario, Game name, status, effective count, declared count';

      const data = games
        .map(
          g =>
            `${encodeCsvCell(i18n.formatDate(g.createdTime || 0))}, ${encodeCsvCell(
              g.creator,
            )}, ${encodeCsvCell(g.gameModelName)}, ${encodeCsvCell(g.gameName)}, ${encodeCsvCell(
              g.status,
            )}, ${encodeCsvCell(g.effectiveCount)}, ${encodeCsvCell(g.declaredCount)}`,
        )
        .join('\n');

      const csv = `${headers}\n${data}`;
      navigator.clipboard.writeText(csv);

      const pom: HTMLAnchorElement = document.createElement('a');
      pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
      pom.setAttribute('download', 'export.csv');
      pom.click();
    },
    [i18n],
  );

  if (notReady) {
    return (
      <div>
        <h3>{i18n.invoicing}</h3>
        <InlineLoading />
      </div>
    );
  } else {
    const all = gameAdmins;
    const filtered = filter ? all.filter(matchSearch(filter)) : all;

    const sorted = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'createdTime') {
        return reverse * ((a.createdTime || 0) - (b.createdTime || 0));
      } else if (sortBy.key === 'creator') {
        return reverse * (a.creator || '').localeCompare(b.creator || '');
      } else if (sortBy.key === 'gameModelName') {
        return reverse * (a.gameModelName || '').localeCompare(b.gameModelName || '');
      } else if (sortBy.key === 'diff') {
        return reverse * (a.diff - b.diff);
      } else if (sortBy.key === 'effectiveCount') {
        return reverse * (a.effectiveCount - b.effectiveCount);
      } else if (sortBy.key === 'declaredCount') {
        return reverse * (a.declaredCount - b.declaredCount);
      } else if (sortBy.key === 'gameStatus') {
        return reverse * (a.gameStatus || '').localeCompare(b.gameStatus || '');
      } else {
        return 0;
      }
    });

    const filterEntries: {
      value: NonNullable<IGameAdminWithTeams['status']>;
      label: React.ReactNode;
    }[] = [
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
            onSelect={setStatusFilterCb}
          />
          <DebouncedInput
            size="SMALL"
            value={filter}
            placeholder={i18n.search}
            onChange={setFilter}
          />
          <IconButton icon={faFileExcel} onClick={() => toCsv(filtered)} />
        </Flex>

        <div className={fullWidthHack}>
          <WindowedContainer
            items={sorted}
            emptyMessage={<i>{filter ? i18n.noGamesFound : i18n.noGames}</i>}
          >
            {createCardCb}
          </WindowedContainer>
        </div>
      </FitSpace>
    );
  }
}
