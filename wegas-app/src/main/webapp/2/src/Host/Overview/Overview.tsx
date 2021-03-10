import { css } from 'emotion';
import * as React from 'react';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Modal } from '../../Components/Modal';
import { expandWidth, grow } from '../../css/classes';
import { GameModel, Player } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { createScript } from '../../Helper/wegasEntites';
import { wlog } from '../../Helper/wegaslog';
import { OverviewHeader } from './OverviewHeader';
import { OverviewRow } from './OverviewRow';

const tableStyle = css({
  display: "flex",
  color: "#828282",
  width: "100%",
  overflowX: "auto",
  fontSize: "14px",
  col: {
    backgroundColor: "#ddd",
    borderRight: "solid 2px",
  },
  table: {
    borderCollapse: "collapse",
    borderSpacing: "5px",
    td: {
      minWidth: "60px",
      height: "35px",
      ".data": {
        backgroundColor: "#fff",
        boxShadow: "1px 2px 6px rgba(0, 0, 0, 0.1)",
        height: "100%",
        padding: "15px 20px",
        textAlign: "center",
      }
    }
  },
  ".scrollable": {
    "thead tr": {
      height: "55px",
      th: {
        backgroundColor: "transparent",
        boxShadow: "none",
        verticalAlign: "bottom",
        padding: "0 10px"
      }
    }
  }
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

const defaultLayoutState = {
  showImpactModal: false,
  showMailModal: false,
};

export default function Overview() {
  const [layoutState, setLayoutState] = React.useState(defaultLayoutState);
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
      wlog(res);
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

  const onRowClick = React.useCallback((type: OverviewClickType) => {
    switch (type) {
      case 'Impact': {
        setLayoutState(os => ({ ...os, showImpactModal: true }));
        break;
      }
      case 'Mail': {
        setLayoutState(os => ({ ...os, showMailModal: true }));
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
  }, []);

  return (
    <div className={expandWidth}>
      <Button icon="undo" onClick={refreshOverview} />
      <div className={tableStyle}>
        <table>
          <OverviewHeader overviewState={overviewState} />
          <tbody>
            {Object.entries(teams).map(([id, team]) => (
              <OverviewRow
                key={id}
                team={team}
                structure={overviewState?.row}
                data={overviewState?.data[id]}
                onClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      {(layoutState.showImpactModal || layoutState.showMailModal) && (
        <Modal onExit={() => setLayoutState(defaultLayoutState)}>
          {layoutState.showImpactModal ? <div>Impacts</div> : <div>Mail</div>}
        </Modal>
      )}
    </div>
  );
}
