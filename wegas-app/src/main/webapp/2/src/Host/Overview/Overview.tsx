import { css, Interpolation } from 'emotion';
import * as React from 'react';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Toolbar } from '../../Components/Toolbar';
import { expandWidth } from '../../css/classes';
import { GameModel, Player } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { createScript } from '../../Helper/wegasEntites';
import { OverviewHeader } from './OverviewHeader';
import { OverviewRow } from './OverviewRow';
import '../../Editor/Components/FormView';
import { ModalState, OverviewModal } from './OverviewModal/OverviewModal';
import { instantiate } from '../../data/scriptable';
import { themeVar } from '../../Components/Style/ThemeVars';
import { sortFnFactory, SortState } from '../TableSorter';
import { FilterState } from './OverviewModal/FilterModalContent';
import { useWebsocket } from '../../API/websocket';
<<<<<<< HEAD
import { wlog } from '../../Helper/wegaslog';
=======
>>>>>>> efe2db1fa8ba62b5e226a99e4867cac4463b644d

export const trainerCellStyleI: Interpolation<undefined> = {
  backgroundColor: '#fff',
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
  padding: '15px 20px',
  textAlign: 'center',
  margin: '3px',
  height: '48px',
  '&> p': {
    margin: 0,
  },
  '&> button': {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export const tableStyle = css({
  display: 'flex',
  color: themeVar.Common.colors.DarkTextColor,
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
        fill: themeVar.Common.colors.DarkTextColor,
      },
      'button:hover + svg': {
        fill: themeVar.Common.colors.ActiveColor,
      },
    },
  },
});

const flexAuto = css({
  flex: '0 0 auto',
});

export interface OverviewItem {
  id: string;
  label: string;
  order: number;
}

export type ValueKind =
  | 'number'
  | 'string'
  | 'text'
  | 'boolean'
  | 'object'
  | 'inbox';

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
  transformer?: string;
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

export default function Overview() {
  const [filterState, setFilterState] = React.useState<FilterState>();
  const [layoutState, setLayoutState] = React.useState<LayoutState>(
    defaultLayoutState,
  );
  const [overviewState, setOverviewState] = React.useState<OverviewState>();
  const [sortState, setSortState] = React.useState<SortState>();
  const [newData, setNewData] = React.useState(false);

  const mounted = React.useRef(true);

  useWebsocket('populateQueue-dec', () => {
    setNewData(true);
  });

  useWebsocket('EntityUpdatedEvent', () => {
    setNewData(true);
  });

  const refreshOverview = React.useCallback(() => {
    setNewData(false);
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript('WegasDashboard.getOverview();'),
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
        setFilterState(o =>
          o == null
            ? structure.reduce(
                (o, r) => ({
                  ...o,
                  [r.id]: (r.items as OverviewItem[]).reduce(
                    (o, i) => ({ ...o, [i.id]: true }),
                    {},
                  ),
                }),
                {},
              )
            : o,
        );
      }
    });
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    refreshOverview();
    return () => {
      mounted.current = false;
    };
  }, [refreshOverview]);

  const teams = useStore(s => s.teams);

  const onRowClick = React.useCallback(
    (team?: STeam | STeam[]) => (
      type: OverviewClickType,
      item?: ActionItem,
    ) => {
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
          const win = window.open(
            'player.html?gameId=' + CurrentGame.id,
            '_blank',
          );
          win?.focus();
          break;
        }
      }
    },
    [],
  );

  const sortFn = React.useCallback(
    (a, b) => {
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

  return (
    <Toolbar className={expandWidth}>
      <Toolbar.Header className={css({ justifyContent: 'flex-end' })}>
        <Button
          icon="filter"
          onClick={() =>
            setLayoutState({
              modalState: 'Filter',
              team: undefined,
              item: undefined,
            })
          }
        />
        <Button icon="undo" onClick={refreshOverview} />
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
                .filter(([, t]) => t['@class'] === 'Team')
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
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
