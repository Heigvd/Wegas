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
import { IGameModelWithId } from 'wegas-ts-api';
import {getGameModelsPaginated, getShadowUserByIds} from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useLocalStorageState } from '../../preferences';
import { useAccountsByUserIds, useCurrentUser } from '../../selectors/userSelector';
import { MINE_OR_ALL, useGameModelsById, useGameModelStoreNoticeableChangesCount } from '../../selectors/wegasSelector';
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
import CreateModel from './CreateModel';
import CreateScenario from './CreateScenario';
import GameModelCard from './GameModelCard';
import InferModel from './InferModel';
import Checkbox from "../common/Checkbox";
import {IPage} from "../../API/restClient";

export interface ScenaristTabProps {
  gameModelType: IGameModelWithId['type'];
}

export default function ScenaristTab({ gameModelType }: ScenaristTabProps): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const { isAdmin } = useCurrentUser();

  const [createPanelViewMode, setCreatePanelViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>(
      'COLLAPSED',
  );
  const [inferModelViewMode, setInferModelViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>(
      'COLLAPSED',
  );

  const [gameStatusFilter, setGameStatusFilter] = useLocalStorageState<IGameModelWithId['status']>(
    'scenarist-status',
    'LIVE',
  );
  const [mineFilter, setMineFilter] = useLocalStorageState<MINE_OR_ALL>(
    'scenarist-mineOrAll',
    isAdmin ? 'MINE' : 'ALL',
  );

  const [filter, setFilter] = React.useState('');

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const [isDataReady, setIsDataReady] = React.useState<boolean>(false);
  const [renderedGameModelsIds, setRenderedGameModelsIds] = React.useState<number[]>([]);
  const [totalResults, setTotalResults] = React.useState<number>(0);

  /**
   * used as a trigger to refresh the list of paginated game models
   * otherwise the list would not change if game models are added or removed
   */
  const nbGameModelStoreChanges = useGameModelStoreNoticeableChangesCount();

  const gamemodels = useGameModelsById(renderedGameModelsIds);

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
      setPage(1)
    }
    // page must not be set as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatusFilter, gameModelType, pageSize, filter, mineFilter]);

  // launch the game models fetch
  // when there is any change on any filter or display choice
  // OR if game models were added or changed status or deleted in the store (nbGameModelStoreChanges)
  React.useEffect(() => {
    setIsDataReady(false);
    dispatch(getGameModelsPaginated({
      type: gameModelType,
      status: gameStatusFilter,
      mine: isAdmin ? mineFilter === 'MINE' : true,
      permissions: ['Edit', 'Translate'],
      page: page,
      size: pageSize,
      query: filter,
    }))
      .then(action => {
        const payload = (action.payload as IPage<IGameModelWithId>);
        setRenderedGameModelsIds(payload.pageContent.map((gameModel: IGameModelWithId) => gameModel.id));
        setTotalResults(payload.total);
        setIsDataReady(true);
      });
  }, [dispatch, isAdmin, gameStatusFilter, gameModelType, page, pageSize, filter, mineFilter, nbGameModelStoreChanges]);

  const buildCardCb = React.useCallback(
      (gameModel: IGameModelWithId) => <GameModelCard key={gameModel.id} gameModel={gameModel} />,
      [],
  );

  const userIds: number[] = uniq(
    gamemodels.gamemodels.flatMap(gm => (gm.createdById != null ? [gm.createdById] : [])),
  );

  const accountsState = useAccountsByUserIds(userIds);

  // This is done to fetch the name of the creators of the games
  React.useEffect(() => {
    if (isAdmin && accountsState.unknownUsers.length > 0) {
      dispatch(getShadowUserByIds(accountsState.unknownUsers));
    }
  }, [isAdmin, accountsState, dispatch]);

  // Detect any gameModel id in URL
  const resolvedPath = useResolvedPath("./");

  const match = useMatch<'id', string>(`${resolvedPath.pathname}:id/*`);
  const selectedId = Number(match?.params.id) || undefined;

  const selected = gamemodels.gamemodels.find(gm => gm.id === selectedId);

  const statusFilterEntries: { value: IGameModelWithId['status']; label: React.ReactNode }[] = [
    {
      value: 'LIVE',
      label: <div className={itemStyle}>{i18n.liveGameModels}</div>,
    },
    {
      value: 'BIN',
      label: <div className={itemStyle}>{i18n.archivedGameModels}</div>,
    },
  ];

  if (isAdmin) {
    statusFilterEntries.push({
      value: 'DELETE',
      label: <div className={itemStyle}>{i18n.deletedGameModels}</div>,
    });
  }
  const dropDownStatus = (
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
        state={createPanelViewMode}
        onClose={() => {
          setCreatePanelViewMode('COLLAPSED');
        }}
      >
        {createPanelViewMode === 'EXPANDED' ? (
          gameModelType === 'SCENARIO' ? (
            <CreateScenario
              close={() => {
                setCreatePanelViewMode('COLLAPSED');
              }}
            />
          ) : (
            <CreateModel
              close={() => {
                setCreatePanelViewMode('COLLAPSED');
              }}
            />
          )
        ) : null}
      </DropDownPanel>

      {gameModelType === 'MODEL' ? (
        <DropDownPanel
          state={inferModelViewMode}
          onClose={() => {
            setInferModelViewMode('COLLAPSED');
          }}
        >
          {inferModelViewMode === 'EXPANDED' ? (
            <InferModel
              close={() => {
                setInferModelViewMode('COLLAPSED');
              }}
            />
          ) : null}
        </DropDownPanel>
      ) : null}

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
              setCreatePanelViewMode('EXPANDED');
            }}
            title={gameModelType === 'SCENARIO' ? i18n.createGameModel : i18n.createModel}
          >
            {gameModelType === 'SCENARIO' ? i18n.createGameModel : i18n.createModel}
          </IconButton>

          {gameModelType === 'MODEL' ? (
            <IconButton
              icon={faPlusCircle}
              iconColor={successColor.toString()}
              onClick={() => {
                setInferModelViewMode('EXPANDED');
              }}
              title={i18n.inferModel}
            >
              {i18n.inferModel}
            </IconButton>
          ) : null}

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
          <Flex align="flex-start">
            <h3>{`${totalResults} ${i18n.gameModels}`}</h3>
          </Flex>
          {totalResults > pageSize /* show pagination tools only if needed */ && (
            <>
              <Flex>
                <h3>
                  <IconButton onClick={onPreviousPage} icon={'caret-left'}></IconButton>
                  {page}/{totalResults > 0 ? Math.ceil(totalResults / pageSize) : 1}
                  <IconButton onClick={onNextPage} icon={'caret-right'}></IconButton>
                </h3>
              </Flex>
              <Flex align="flex-end">
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
            </>
          )}
        </Flex>
        {isDataReady ? (
          <WindowedContainer
            items={gamemodels.gamemodels}
            scrollTo={selected}
            emptyMessage={
              <i>
                {filter
                  ? gameModelType === 'SCENARIO'
                    ? i18n.noScenariosFound
                    : i18n.noModelsFound
                  : gameModelType === 'SCENARIO'
                  ? i18n.noScenarios
                  : i18n.noModels}
              </i>
            }
          >
            {buildCardCb}
          </WindowedContainer>
        ) : (
          <InlineLoading />
        )}
      </FitSpace>
    </FitSpace>
  );
}