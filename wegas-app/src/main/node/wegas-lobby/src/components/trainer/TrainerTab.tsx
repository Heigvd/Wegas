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
import { MINE_OR_ALL, useGamesByIds } from '../../selectors/wegasSelector';
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
import { IPage } from '../../API/restClient';

export default function TrainerTab(): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const { currentUser, isAdmin } = useCurrentUser();

  const [gameCreationPanelMode, setGameCreationPanelMode] = React.useState<'EXPANDED' | 'COLLAPSED'>('COLLAPSED');

  const [gameStatusFilter, setGameStatusFilter] = useLocalStorageState<IGameWithId['status']>(
    'trainer.status',
    'LIVE',
  );
  const [mineFilter, setMineFilter] = useLocalStorageState<MINE_OR_ALL>(
    'trainer-mineOrAll',
    'MINE',
  );

  const [filter, setFilter] = React.useState('');

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const [isDataReady, setIsDataReady] = React.useState<boolean>(false);
  const [renderedGamesIds, setRenderedGamesIds] = React.useState<number[]>([]);
  const [totalResults, setTotalResults] = React.useState<number>(0);

  const games = useGamesByIds(
    gameStatusFilter,
    currentUser != null ? currentUser.id : undefined,
    isAdmin ? mineFilter : 'MINE',
    renderedGamesIds
  );

  //non-admin should never see deleted
  React.useEffect(() => {
    if (!isAdmin && gameStatusFilter === 'DELETE') {
      setGameStatusFilter('BIN');
    }
  }, [isAdmin, gameStatusFilter, setGameStatusFilter]);

  const onFilterChange = React.useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  const onNextPage = () => setPage(page < totalResults / pageSize ? page + 1 : page);
  const onPreviousPage = () => setPage(page > 1 ? page - 1 : 1);

  // if we change any filter or display choice, come back to first page
  React.useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // page must not be set as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatusFilter, pageSize, filter, mineFilter]);

  // launch the games fetch on change on any filter or display choice
  React.useEffect(() => {
    setIsDataReady(false);
    dispatch(
      getGamesPaginated({
        status: gameStatusFilter,
        page: page,
        size: pageSize,
        query: filter,
        mine: isAdmin ? mineFilter === 'MINE' : true,
      }),
    ).then((action) => {
      const payload = action.payload as IPage<IGameWithId>;
      setRenderedGamesIds(payload.pageContent.map((game: IGameWithId) => game.id));
      setTotalResults(payload.total);
      setIsDataReady(true);
    });
  }, [dispatch, gameStatusFilter, page, pageSize, filter, mineFilter]);

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

  const userIds: number[] = uniq(
    games.gamesAndGameModels.flatMap(data =>
      data.game.createdById != null ? [data.game.createdById] : [],
    ),
  );

  const accountsState = useAccountsByUserIds(userIds);

  // This is done to fetch the name of the creators of the games
  React.useEffect(() => {
    if (isAdmin && accountsState.unknownUsers.length > 0) {
      dispatch(getShadowUserByIds(accountsState.unknownUsers));
    }
  }, [isAdmin, accountsState, dispatch]);

  // Detect any gameModel id in URL
  const resolvedPath = useResolvedPath('./');

  const match = useMatch<'id', string>(`${resolvedPath.pathname}:id/*`);
  const selectedId = Number(match?.params.id) || undefined;

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
  const dropDownGameStatus = (
    <DropDownMenu
      menuIcon="CARET"
      entries={statusFilterEntries}
      value={gameStatusFilter}
      onSelect={setGameStatusFilter}
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
  const dropDownMineOrAll = isAdmin ? (
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
        state={gameCreationPanelMode}
        onClose={() => {
          setGameCreationPanelMode('COLLAPSED');
        }}
      >
        {gameCreationPanelMode === 'EXPANDED' && (
          <CreateGame
            close={() => {
              setGameCreationPanelMode('COLLAPSED');
            }}
          />
        )}
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
              setGameCreationPanelMode('EXPANDED');
            }}
          >
            {i18n.createGame}
          </IconButton>

          {dropDownGameStatus}
          {dropDownMineOrAll}

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
          <Flex
            align="flex-start"
          >
            <h3>{`${totalResults} ${i18n.games}`}</h3>
          </Flex>
          {totalResults > pageSize /* show pagination tools only if needed */ &&
            (<>
            <Flex>
              <h3>
                <IconButton onClick={onPreviousPage} icon={'caret-left'}></IconButton>
                {page}/{totalResults > 0 ? Math.ceil(totalResults / pageSize) : 1}
                <IconButton onClick={onNextPage} icon={'caret-right'}></IconButton>
              </h3>
            </Flex>
            <Flex
              align="flex-end"
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
            </Flex>
          </>)
        }
        </Flex>

        {isDataReady ?
          (<WindowedContainer
              items={games.gamesAndGameModels}
              scrollTo={selected}
              emptyMessage={<i>{filter ? i18n.noGamesFound : i18n.noGames}</i>}
            >
              {buildCardCb}
            </WindowedContainer>)
          : (<InlineLoading />)
        }
      </FitSpace>
    </FitSpace>
  );
}
