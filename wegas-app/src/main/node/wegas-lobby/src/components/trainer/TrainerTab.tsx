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
import { useMatch, useResolvedPath } from 'react-router-dom';
import { IGameModelWithId, IGameWithId } from 'wegas-ts-api';
import { getGamesPaginated, getShadowUserByIds } from '../../API/api';
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
import { successColor } from '../styling/color';
import { panelPadding } from '../styling/style';
import CreateGame from './CreateGame';
import GameCard from './GameCard';
import Checkbox from '../common/Checkbox';

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
    !isAdmin && statusFilter === 'DELETE' ? 'BIN' : statusFilter, //non-admin should never see deleted
    currentUser != null ? currentUser.id : undefined,
    isAdmin ? mineFilter : 'MINE', // non-admin only see theirs
  );

  const [viewMode, setViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>('COLLAPSED');

  const [filter, setFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const onNextPage = () => setPage(page < games.totalResults / pageSize ? page + 1 : page);
  const onPreviousPage = () => setPage(page > 1 ? page - 1 : 1);

  const onFilterChange = React.useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  const status = games.status[statusFilter];

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(
        getGamesPaginated({ status: statusFilter, page: page, size: pageSize, query: filter, mine: mineFilter === 'MINE' }),
      );
    }
  }, [status, dispatch, statusFilter]);

  React.useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      dispatch(
        getGamesPaginated({ status: statusFilter, page: page, size: pageSize, query: filter, mine: mineFilter === 'MINE'  }),
      );
    }
  }, [filter, pageSize, statusFilter, mineFilter]);

  React.useEffect(() => {
    dispatch(
      getGamesPaginated({ status: statusFilter, page: page, size: pageSize, query: filter, mine: mineFilter === 'MINE'  }),
    );
  }, [page]);

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

  React.useEffect(() => {
    if (isAdmin && accountsState.unknownUsers.length > 0) {
      dispatch(getShadowUserByIds(accountsState.unknownUsers));
    }
  }, [isAdmin, accountsState, dispatch]);

  // Detect any gameModel id in URL
  const resolvedPath = useResolvedPath('./');

  const match = useMatch<'id', string>(`${resolvedPath.pathname}:id/*`);
  const selectedId = Number(match?.params.id) || undefined;

  if (games.status[statusFilter] === 'NOT_INITIALIZED') {
    return <InlineLoading />;
  } else {
    const selected = games.gamesAndGameModels.find(ggm => ggm.gameModel.id === selectedId);

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
              callback={() =>
                dispatch(
                  getGamesPaginated({
                    status: statusFilter,
                    page: page,
                    size: pageSize,
                    query: filter,
                    mine: mineFilter === 'MINE',
                  }),
                )
              }
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

            {dropDownStatus}
            {dropDownMine}

            <DebouncedInput
              size="SMALL"
              value={filter}
              placeholder={i18n.search}
              onChange={onFilterChange}
            />
          </Flex>

          <Flex
            justify="space-between"
            align="center"
            className={css({
              flexShrink: 0,
              height: '20px',
            })}
          >
            <div
              className={css({
                display: 'flex',
                alignContent: 'flex-start',
              })}
            >
              <h3>{`${games.totalResults} ${i18n.games}`}</h3>
            </div>
            <div>
              <h3>
                <IconButton onClick={onPreviousPage} icon={'caret-left'}></IconButton>
                {page}/{games.totalResults > 0 ? Math.ceil(games.totalResults / pageSize) : 1}
                <IconButton onClick={onNextPage} icon={'caret-right'}></IconButton>
              </h3>
            </div>
            <div
              className={css({
                display: 'flex',
                alignContent: 'flex-end',
                flexDirection: 'row',
              })}
            >
              <Checkbox
                label="20"
                value={pageSize === 20}
                onChange={(newValue: boolean) => setPageSize(newValue ? 20 : pageSize)}
              />
              <Checkbox
                label="50"
                value={pageSize === 50}
                onChange={(newValue: boolean) => setPageSize(newValue ? 50 : pageSize)}
              />
              <Checkbox
                label="100"
                value={pageSize === 100}
                onChange={(newValue: boolean) => setPageSize(newValue ? 100 : pageSize)}
              />
            </div>
          </Flex>

          {status === 'READY' ? (
            <>
              <WindowedContainer
                items={games.gamesAndGameModels}
                scrollTo={selected}
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
