/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { uniq } from 'lodash';
import * as React from 'react';
import { IAbstractAccount, IGameModelWithId, IGameWithId } from 'wegas-ts-api';
import { getGames, getShadowUserByIds } from '../../API/api';
import { getDisplayName, mapByKey, match } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useLocalStorageState } from '../../preferences';
import { useAccountsByUserIds, useCurrentUser } from '../../selectors/userSelector';
import { MINE_OR_ALL, useGames } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import { WindowedContainer } from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import DropDownMenu, { itemStyle } from '../common/DropDownMenu';
import DropDownPanel from '../common/DropDownPanel';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import SortBy, { SortByOption } from '../common/SortBy';
import { successColor } from '../styling/color';
import { panelPadding } from '../styling/style';
import CreateGame from './CreateGame';
import GameCard from './GameCard';

interface SortBy {
  createdByName: string;
  name: string;
  createdTime: number;
}

const matchSearch =
  (accountMap: Record<number, IAbstractAccount>, search: string) =>
  ({ game, gameModel }: { game: IGameWithId; gameModel: IGameModelWithId }) => {
    return match(search, regex => {
      const username = game.createdById != null ? getDisplayName(accountMap[game.createdById]) : '';
      return (
        (gameModel.name && gameModel.name.match(regex) != null) ||
        (game.name && game.name.match(regex) != null) ||
        (game.token && game.token.match(regex) != null) ||
        username.match(regex) != null
      );
    });
  };

export default function TrainerTab(): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const { currentUser, isAdmin } = useCurrentUser();

  const [statusFilter, setStatusFilter] = useLocalStorageState<IGameWithId['status']>(
    'trainer.status',
    'LIVE',
  );
  const [mineFilter, setMineFilter] = useLocalStorageState<MINE_OR_ALL>(
    'trainer-mineOrAll',
    'MINE',
  );

  React.useEffect(() => {
    if (!isAdmin && statusFilter === 'DELETE') {
      setStatusFilter('BIN');
    }
  }, [isAdmin, statusFilter, setStatusFilter]);

  const games = useGames(
    !isAdmin && statusFilter === 'DELETE' ? 'BIN' : statusFilter, //non-admin should never sees deleteds
    currentUser != null ? currentUser.id : undefined,
    isAdmin ? mineFilter : 'MINE', // non-admin only see theirs
  );

  const [viewMode, setViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>('COLLAPSED');

  const [sortBy, setSortBy] = useLocalStorageState<{ key: keyof SortBy; asc: boolean }>(
    'trainer-sortby',
    {
      key: 'createdTime',
      asc: false,
    },
  );

  //  const onSortChange = React.useCallback(({ key, asc }: { key: keyof SortBy; asc: boolean }) => {
  //    setSortBy({ key, asc });
  //  }, []);

  const [filter, setFilter] = React.useState('');

  const onFilterChange = React.useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  const sortOptions: SortByOption<SortBy>[] = [
    { key: 'createdTime', label: i18n.date },
    { key: 'name', label: i18n.name },
  ];
  if (isAdmin) {
    sortOptions.push({ key: 'createdByName', label: i18n.createdBy });
  }

  const status = games.status[statusFilter];

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(getGames(statusFilter));
    }
  }, [status, dispatch, statusFilter]);

  const userIds = uniq(
    games.gamesAndGameModels.flatMap(data =>
      data.game.createdById != null ? [data.game.createdById] : [],
    ),
  );

  const buildCardCb = React.useCallback(
    (gameAndGameModel: { game: IGameWithId; gameModel: IGameModelWithId }) => (
      <GameCard
        key={gameAndGameModel.game.id}
        game={gameAndGameModel.game}
        gameModel={gameAndGameModel.gameModel}
      />
    ),
    [],
  );

  const accountsState = useAccountsByUserIds(userIds);
  const accounts = mapByKey(accountsState.accounts, 'parentId');

  React.useEffect(() => {
    if (isAdmin && accountsState.unknownUsers.length > 0) {
      dispatch(getShadowUserByIds(accountsState.unknownUsers));
    }
  }, [isAdmin, accountsState, dispatch]);

  // Detect any gameModel id in URL
  // const location = useLocation();
  // const match = useRouteMatch();

  // const selectedId = Number.parseInt(location.pathname.replace(match.path + '/', ''));

  if (games.status[statusFilter] === 'NOT_INITIALIZED') {
    return <InlineLoading />;
  } else {
    // const selected = games.gamesAndGameModels.find(ggm => ggm.gameModel.id === selectedId);

    const filtered = filter
      ? games.gamesAndGameModels.filter(matchSearch(accounts, filter))
      : games.gamesAndGameModels;
    const sorted = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'createdTime') {
        return reverse * (a.game.createdTime! - b.game.createdTime!);
      } else if (sortBy.key === 'name') {
        const aName =
          a.game.createdById != null ? getDisplayName(accounts[a.game.createdById]) : '';
        const bName =
          b.game.createdById != null ? getDisplayName(accounts[b.game.createdById]) : '';

        return reverse * aName.localeCompare(bName);
      }
      return 0;
    });

    const statusFilterEntries: { value: IGameWithId['status']; label: React.ReactNode }[] = [
      {
        value: 'LIVE',
        label: <div className={itemStyle}>{i18n.liveGames}</div>,
      },
      {
        value: 'BIN',
        label: <div className={itemStyle}>{i18n.archivedGames}</div>,
      },
    ];

    if (isAdmin) {
      statusFilterEntries.push({
        value: 'DELETE',
        label: <div className={itemStyle}>{i18n.deletedGames}</div>,
      });
    }
    const dropDownStatus = (
      <DropDownMenu
        menuIcon="CARET"
        entries={statusFilterEntries}
        value={statusFilter}
        onSelect={setStatusFilter}
      />
    );

    const mineFilterEntries: { value: MINE_OR_ALL; label: React.ReactNode }[] = [
      {
        value: 'MINE',
        label: <div className={itemStyle}>{i18n.mine}</div>,
      },
      {
        value: 'ALL',
        label: <div className={itemStyle}>{i18n.all}</div>,
      },
    ];

    const dropDownMine = isAdmin ? (
      <DropDownMenu
        menuIcon="CARET"
        entries={mineFilterEntries}
        value={mineFilter}
        onSelect={setMineFilter}
      />
    ) : null;

    return (
      <FitSpace direction="column" overflow="auto" className={css({ position: 'relative' })}>
        <DropDownPanel
          state={viewMode}
          onClose={() => {
            setViewMode('COLLAPSED');
          }}
        >
          {viewMode === 'EXPANDED' ? (
            <CreateGame
              close={() => {
                setViewMode('COLLAPSED');
              }}
            />
          ) : null}
        </DropDownPanel>

        <FitSpace direction="column" overflow="auto" className={panelPadding}>
          <Flex
            justify="space-between"
            align="center"
            className={css({
              flexShrink: 0,
              height: '80px',
            })}
          >
            <IconButton
              icon={faPlusCircle}
              iconColor={successColor.toString()}
              onClick={() => {
                setViewMode('EXPANDED');
              }}
            >
              {i18n.createGame}
            </IconButton>
            <SortBy options={sortOptions} current={sortBy} onChange={setSortBy} />

            {dropDownStatus}
            {dropDownMine}

            <DebouncedInput
              size="SMALL"
              value={filter}
              placeholder={i18n.search}
              onChange={onFilterChange}
            />
          </Flex>

          {status === 'READY' ? (
            <>
              <WindowedContainer
                items={sorted}
                // scrollTo={selected}
                emptyMessage={<i>{filter ? i18n.noGamesFound : i18n.noGames}</i>}
              >
                {buildCardCb}
              </WindowedContainer>
            </>
          ) : (
            <InlineLoading />
          )}
        </FitSpace>
      </FitSpace>
    );
  }
}
