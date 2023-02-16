import { css, CSSInterpolation, cx } from '@emotion/css';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { useWebsocketEvent } from '../../API/websocket';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import { expandWidth, flex, flexRow } from '../../css/classes';
import { TeamState } from '../../data/Reducer/teams';
import { instantiate } from '../../data/scriptable';
import { Game, GameModel, Player } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import '../../Editor/Components/FormView';
import { createScript } from '../../Helper/wegasEntites';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { trainerTranslations } from '../../i18n/trainer/trainer';
import { sortFnFactory, SortState } from '../TableSorter';
import { OverviewHeader } from './OverviewHeader';
import { FilterState } from './OverviewModal/FilterModalContent';
import { ModalState, OverviewModal } from './OverviewModal/OverviewModal';
import { OverviewRow } from './OverviewRow';

export const trainerCellStyleI: CSSInterpolation = {
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
  padding: '5px',
  textAlign: 'center',
  margin: '3px',
  height: '48px',
  '&> p': {
    margin: 0,
  },
};

export const tableStyle = css({
  display: 'flex',
  color: themeVar.colors.DarkTextColor,
  width: '100%',
  overflowX: 'auto',
  fontSize: '14px',
  colgroup: {
    borderLeft: 'solid 15px transparent',
    borderRight: 'solid 15px transparent',
  },
  table: {
    borderCollapse: 'collapse',
    td: {
      minWidth: '60px',
      backgroundColor: '#f9f9f9',
      whiteSpace: 'pre',
      '&> div': {
        ...trainerCellStyleI,
      },
      '& .team-cell': {
        justifyContent: 'flex-start',
      },
    },
    '.collapse': {
      height: '215px',
      td: {
        position: 'absolute',
        '&> div': {
          height: 'auto',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          padding: 0,
          textAlign: 'left',
        },
      },
    },
  },
  'thead tr': {
    height: '25px',
    th: {
      boxShadow: 'none',
      verticalAlign: 'top',
      padding: '0 10px',
      textAlign: 'center',
      'svg, button': {
        fill: themeVar.colors.DarkTextColor,
      },
      'button:hover + svg': {
        fill: themeVar.colors.ActiveColor,
      },
    },
  },
});

const flexAuto = css({
  flex: '0 0 auto',
});

const newDataStyle = css({
  color: themeVar.colors.PrimaryColor + ' !important',
});

export interface OverviewItem {
  id: string;
  label: string;
  order: number;
}

export interface DataObjectType {
  body: string;
  empty: boolean;
  title: string;
}

export type DataType = number | string | boolean | DataObjectType;

export interface DataItem extends OverviewItem {
  active: boolean;
  kind: ValueKind;
  sortable?: boolean;
  formatter?: string;
  sortFn?: string;
  preventClick?: boolean;
}

export interface ActionItem extends OverviewItem {
  do: string;
  hasGlobal?: boolean;
  itemType: string;
  icon: string;
}

interface OverviewDataStructure {
  id: string;
  title: string;
  items: DataItem[] | ActionItem[];
}

export interface OverviewData {
  data: { [teamId: string]: { [key: string]: DataType } };
  structure: OverviewDataStructure[];
}

export function isDataItem(item: DataItem | ActionItem): item is DataItem {
  return 'active' in item && 'kind' in item;
}

export interface OverviewState {
  header: OverviewDataStructure[];
  row: (DataItem | ActionItem)[];
  data: OverviewData['data'];
}

export type OverviewClickType = 'Impact' | 'Mail' | 'Watch team';

interface LayoutState {
  modalState: ModalState;
  team: STeam | STeam[] | undefined;
  item: ActionItem | undefined;
}

const defaultLayoutState: LayoutState = {
  modalState: 'Close',
  team: undefined,
  item: undefined,
};

export interface OverviewProps {
  dashboardName?: string;
}

export default function Overview({
  dashboardName = 'overview',
}: OverviewProps) {
  const [filterState, setFilterState] = React.useState<FilterState>();
  const [layoutState, setLayoutState] =
    React.useState<LayoutState>(defaultLayoutState);
  const [overviewState, setOverviewState] = React.useState<OverviewState>();
  const [sortState, setSortState] = React.useState<SortState>();
  const [newData, setNewData] = React.useState(false);

  const mounted = React.useRef(true);

  useWebsocketEvent('populateQueue-dec', () => {
    setNewData(true);
  });

  useWebsocketEvent('EntityUpdatedEvent', () => {
    setNewData(true);
  });

  const game = Game.selectCurrent();

  const isRealGame = GameModel.selectCurrent().type === 'PLAY';

  const i18nValues = useInternalTranslate(commonTranslations);
  const i18nValuesTrainer = useInternalTranslate(trainerTranslations);
  const teams = useStore(s => {
    return Object.entries(s.teams)
      .filter(([, team]) => team.parentId === game.id)
      .reduce<TeamState>((teams, [teamId, team]) => {
        teams[teamId] = team;
        return teams;
      }, {});
  }, deepDifferent);

  const buildFilter = (structure: OverviewDataStructure[], value: boolean) => {
    const filtered: FilterState = {};
    for (const row of structure) {
      filtered[row.id] = {};
      for (const item of row.items) {
        filtered[row.id][item.id] = value;
      }
    }
    return filtered;
  };

  const refreshOverview = React.useCallback(() => {
    setNewData(false);
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript(
        `WegasDashboard.getOverview(${JSON.stringify(dashboardName)});`,
        'JavaScript',
      ),
      undefined,
      true,
    ).then((res: OverviewData) => {
      if (mounted.current) {
        const { data, structure } = res;
        const row = structure.reduce(
          (o, s) => [
            ...o,
            ...s.items.sort(
              (ia: OverviewItem, ib: OverviewItem) => ia.order - ib.order,
            ),
          ],
          [],
        );
        setOverviewState({ header: structure, row, data });
        setFilterState(o => (o == null ? buildFilter(structure, true) : o));
      }
    });
  }, [dashboardName]);

  React.useEffect(() => {
    mounted.current = true;
    refreshOverview();
    return () => {
      mounted.current = false;
    };
  }, [refreshOverview]);

  const onRowClick = React.useCallback(
    (team?: STeam | STeam[]) => (type: OverviewClickType, item?: ActionItem) => {
      switch (type) {
        case 'Impact': {
          setLayoutState({ modalState: 'Impacts', team, item });
          break;
        }
        case 'Mail': {
          setLayoutState({ modalState: 'Mail', team, item: undefined });
          break;
        }
        case 'Watch team': {
          if (team != null && !Array.isArray(team)) {
            const playerId = team.getPlayers().pop()?.getId();
            if (playerId != null) {
              const win = window.open('player.html?id=' + playerId, '_blank');
              win?.focus();
            }
          }
          break;
        }
      }
    },
    [],
  );

  const sortFn = React.useCallback(
    (a: [string, Readonly<ITeam>], b: [string, Readonly<ITeam>]) => {
      const valueA = (overviewState?.data[a[0]] || {})[
        sortState?.sortedValue as keyof OverviewState['data'][string]
      ];
      const valueB = (overviewState?.data[b[0]] || {})[
        sortState?.sortedValue as keyof OverviewState['data'][string]
      ];

      const newA =
        sortState?.sortedValue === 'team'
          ? a[1].name
          : typeof valueA === 'object'
          ? valueA.body
          : valueA;
      const newB =
        sortState?.sortedValue === 'team'
          ? b[1].name
          : typeof valueB === 'object'
          ? valueB.body
          : valueB;

      return sortFnFactory(sortState)(newA, newB);
    },
    [overviewState, sortState],
  );

  const removeFiltersButton = () => {
    return (
      <div className={cx(flex, flexRow)}>
        <Button
          icon="check"
          tooltip={i18nValuesTrainer.manageColumns}
          onClick={() => setFilterState(undefined)}
        />
        <Button
          icon="trash"
          tooltip={i18nValuesTrainer.manageColumns}
          onClick={() =>
            setFilterState(buildFilter(overviewState!.header, false))
          }
        />
      </div>
    );
  };

  return (
    <Toolbar className={expandWidth}>
      <Toolbar.Header className={css({ justifyContent: 'flex-end' })}>
        {newData && (
          <span
            className={cx(
              css({ fontSize: '14px', margin: '5px -5px 5px 0' }),
              newDataStyle,
            )}
          >
            {i18nValues.newChanges}
          </span>
        )}
        <Button
          icon="undo"
          tooltip={i18nValuesTrainer.refreshData}
          onClick={refreshOverview}
          className={cx({ [newDataStyle]: newData })}
        />
        <Button
          icon="filter"
          tooltip={i18nValuesTrainer.manageColumns}
          onClick={() =>
            setLayoutState({
              modalState: 'Filter',
              team: undefined,
              item: undefined,
            })
          }
        />
        <Button
          icon="file-excel"
          tooltip={i18nValuesTrainer.exportTeamsData}
          onClick={() => {
            window.open(
              `${API_ENDPOINT}GameModel/Game/${Game.selectCurrent()
                .id!}/ExportMembers.xlsx`,
              '_blank',
            );
          }}
        />
      </Toolbar.Header>
      <Toolbar.Content className={flexAuto}>
        <div className={tableStyle}>
          <table key={JSON.stringify(Object.keys(teams))}>
            <OverviewHeader
              filterState={filterState}
              overviewState={overviewState}
              onClick={onRowClick(
                Object.values(teams)
                  .filter(t => t['@class'] === 'Team')
                  .map(t => instantiate(t)),
              )}
              sortState={sortState}
              onClickSort={(sortedValue, sortMode) =>
                setSortState({ sortedValue, sortMode })
              }
            />
            <tbody>
              {Object.entries(teams)
                .filter(([, t]) => !isRealGame || t['@class'] === 'Team')
                .sort(sortFn)
                .map(([id, t]) => {
                  const team = instantiate(t);
                  return (
                    <OverviewRow
                      key={id}
                      team={team}
                      structure={overviewState?.row.filter(
                        r =>
                          filterState == null ||
                          Object.values(filterState).reduce(
                            (o, i) => ({ ...o, ...i }),
                            {},
                          )[r.id],
                      )}
                      data={overviewState?.data[id]}
                      onClick={onRowClick(team)}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
        {layoutState.modalState !== 'Close' && (
          <OverviewModal
            {...layoutState}
            refreshOverview={refreshOverview}
            onExit={() => {
              setLayoutState({
                modalState: 'Close',
                team: undefined,
                item: undefined,
              });
            }}
            filterState={filterState}
            onNewFilterState={setFilterState}
            overviewState={overviewState}
            filterButtons={removeFiltersButton}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
