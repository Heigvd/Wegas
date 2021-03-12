import { css } from 'emotion';
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
import { ModalState, OverviewModal } from './OverviewModal';
import { instantiate } from '../../data/scriptable';

const tableStyle = css({
  display: 'flex',
  color: '#828282',
  width: '100%',
  overflowX: 'auto',
  fontSize: '14px',
  colgroup: {
    borderLeft: 'solid 15px transparent',
    borderRight: 'solid 15px transparent',
    '.fixedColumn': {
      backgroundColor: 'red',
      zIndex: 111,
    },
  },
  table: {
    borderCollapse: 'collapse',
    //borderSpacing: '5px',
    td: {
      minWidth: '60px',
      backgroundColor: '#f9f9f9',
      '&> div': {
        backgroundColor: '#fff',
        boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
        padding: '15px 20px',
        textAlign: 'center',
        margin: '3px',
        height: '48px',
      },
    },
    '.collapse td': {
      position: 'absolute',
      left: 0,
      '&> div': {
        height: 'auto',
        boxShadow: 'none',
        backgroundColor: 'transparent',
        padding: 0,
        textAlign: 'left',
        '&> div': {
          marginRight: '15px',
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
    },
  },
});

interface OverviewItem {
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
  hasGlobal: boolean;
  itemType: string;
  icon: string;
  schema: string;
}

interface OverviewData {
  data: { [teamId: string]: { [key: string]: DataType } };
  structure: {
    title: string;
    items: DataItem[] | ActionItem[];
  }[];
}

export function isDataItem(item: DataItem | ActionItem): item is DataItem {
  return 'active' in item && 'kind' in item;
}

export interface OverviewState {
  header: { title: string; span: number }[];
  row: (DataItem | ActionItem)[];
  data: OverviewData['data'];
}

export type OverviewClickType = 'Impact' | 'Mail' | 'Watch team';

interface LayoutState {
  modalState: ModalState;
  team: STeam | undefined;
  item: ActionItem | undefined;
}

const defaultLayoutState: LayoutState = {
  modalState: 'Close',
  team: undefined,
  item: undefined,
};

export default function Overview() {
  const [layoutState, setLayoutState] = React.useState<LayoutState>(
    defaultLayoutState,
  );
  const [overviewState, setOverviewState] = React.useState<OverviewState>();

  const mounted = React.useRef(true);

  const refreshOverview = React.useCallback(() => {
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript('WegasDashboard.getOverview();'),
      undefined,
      true,
    ).then((res: OverviewData) => {
      if (mounted.current) {
        const { data, structure } = res;
        const header = structure.map(s => ({
          title: s.title,
          span: s.items.length,
        }));
        const row = structure.reduce(
          (o, s) => [
            ...o,
            ...s.items.sort(
              (ia: OverviewItem, ib: OverviewItem) => ia.order - ib.order,
            ),
          ],
          [],
        );
        setOverviewState({ header, row, data });
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
    (team?: STeam) => (type: OverviewClickType, item?: ActionItem) => {
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

  return (
    <Toolbar className={expandWidth}>
      <Toolbar.Header>
        <Button icon="undo" onClick={refreshOverview} />
      </Toolbar.Header>
      <Toolbar.Content>
        <div className={tableStyle}>
          <table>
            <OverviewHeader
              overviewState={overviewState}
              onClick={onRowClick()}
            />
            <tbody>
              {Object.entries(teams).map(([id, t]) => {
                const team = instantiate(t);
                return (
                  <OverviewRow
                    key={id}
                    team={team}
                    structure={overviewState?.row}
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
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
