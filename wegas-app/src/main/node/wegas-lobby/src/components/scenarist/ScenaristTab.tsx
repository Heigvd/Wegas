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
import { useLocation, useRouteMatch } from 'react-router-dom';
import { IAbstractAccount, IGameModelWithId } from 'wegas-ts-api';
import { getGameModels, getShadowUserByIds } from '../../API/api';
import { getDisplayName, mapByKey, match } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useLocalStorageState } from '../../preferences';
import { useAccountsByUserIds, useCurrentUser } from '../../selectors/userSelector';
import { MINE_OR_ALL, useEditableGameModels } from '../../selectors/wegasSelector';
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
import CreateModel from './CreateModel';
import CreateScenario from './CreateScenario';
import GameModelCard from './GameModelCard';
import InferModel from './InferModel';

interface SortBy {
  createdByName: string;
  name: string;
  createdTime: number;
}

const matchSearch =
  (accountMap: Record<number, IAbstractAccount>, search: string) =>
  (gameModel: IGameModelWithId | 'LOADING') => {
    return match(search, regex => {
      if (gameModel != 'LOADING') {
        const username =
          gameModel.createdById != null ? getDisplayName(accountMap[gameModel.createdById]) : '';
        return (
          (gameModel.name && gameModel.name.match(regex) != null) || username.match(regex) != null
        );
      } else {
        return false;
      }
    });
  };

export interface ScenaristTabProps {
  gameModelType: IGameModelWithId['type'];
}

export default function ScenaristTab({ gameModelType }: ScenaristTabProps): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const { currentUser, isAdmin } = useCurrentUser();
  const currentUserId = currentUser != null ? currentUser.id : undefined;

  const [statusFilter, setStatusFilter] = useLocalStorageState<IGameModelWithId['status']>(
    'scenarist-status',
    'LIVE',
  );
  const [mineFilter, setMineFilter] = useLocalStorageState<MINE_OR_ALL>(
    'scenarist-mineOrAll',
    isAdmin ? 'MINE' : 'ALL',
  );

  const gamemodels = useEditableGameModels(
    currentUserId,
    gameModelType,
    !isAdmin && statusFilter === 'DELETE' ? 'BIN' : statusFilter,
    isAdmin ? mineFilter : 'MINE',
  );

  React.useEffect(() => {
    if (!isAdmin && statusFilter === 'DELETE') {
      setStatusFilter('BIN');
    }
  }, [isAdmin, statusFilter, setStatusFilter]);

  const [createPanelViewMode, setCreatePanelViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>(
    'COLLAPSED',
  );
  const [inferModelViewMode, setInferModelViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>(
    'COLLAPSED',
  );

  const [sortBy, setSortBy] = useLocalStorageState<{ key: keyof SortBy; asc: boolean }>(
    'scenarist-sortby',
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

  const status = gamemodels.status[gameModelType][statusFilter];

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: statusFilter, type: gameModelType }));
    }
  }, [statusFilter, gameModelType, status, dispatch]);

  const userIds = uniq(
    gamemodels.gamemodels.flatMap(gm => (gm.createdById != null ? [gm.createdById] : [])),
  );
  const accountsState = useAccountsByUserIds(userIds);
  const accounts = mapByKey(accountsState.accounts, 'parentId');

  const buildCardCb = React.useCallback(
    (gameModel: IGameModelWithId) => <GameModelCard key={gameModel.id} gameModel={gameModel} />,
    [],
  );

  React.useEffect(() => {
    if (isAdmin && accountsState.unknownUsers.length > 0) {
      dispatch(getShadowUserByIds(accountsState.unknownUsers));
    }
  }, [isAdmin, accountsState, dispatch]);

  // Detect any gameModel id in URL
  const location = useLocation();
  const match = useRouteMatch();

  const selectedId = Number.parseInt(location.pathname.replace(match.path + '/', ''));

  if (gamemodels.status[gameModelType][statusFilter] === 'NOT_INITIALIZED') {
    return <InlineLoading />;
  } else {
    const selected = gamemodels.gamemodels.find(gm => gm.id === selectedId);
    const filtered = filter
      ? gamemodels.gamemodels.filter(matchSearch(accounts, filter))
      : gamemodels.gamemodels;

    const sorted = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'createdTime') {
        return reverse * (a.createdTime! - b.createdTime!);
      } else if (sortBy.key === 'name') {
        return reverse * (a.name || '').localeCompare(b.name || '');
      } else if (sortBy.key === 'createdByName') {
        const aName = a.createdById != null ? getDisplayName(accounts[a.createdById]) : '';
        const bName = b.createdById != null ? getDisplayName(accounts[b.createdById]) : '';

        return reverse * aName.localeCompare(bName);
      }
      return 0;
    });

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
              >
                {i18n.inferModel}
              </IconButton>
            ) : null}

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
            </>
          ) : (
            <InlineLoading />
          )}
        </FitSpace>
      </FitSpace>
    );
  }
}

//
//<CardContainer>
//          {sorted.map(gameModel => (
//            <GameModelCard key={gameModel.id} gameModel={gameModel} />
//          ))}
//</CardContainer>
