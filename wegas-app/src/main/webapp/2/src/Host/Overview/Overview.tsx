import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { css } from 'emotion';
import * as React from 'react';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Modal } from '../../Components/Modal';
import { grow } from '../../css/classes';
import { GameModel, Player } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { createScript } from '../../Helper/wegasEntites';
import { wlog } from '../../Helper/wegaslog';
import { OverviewRow } from './OverviewRow';

const headerStyle = css({
  verticalAlign: 'middle',
  textAlign: 'center',
});

interface OverviewItem {
  id: string;
  label: string;
  order: number;
}

export interface DataItem extends OverviewItem {
  active: boolean;
  kind: string;
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
  icon: IconProp;
}

interface OverviewData {
  data: { [teamId: string]: { [key: string]: unknown } };
  structure: {
    title: string;
    items: DataItem[] | ActionItem[];
  }[];
}

export function isDataItem(item: DataItem | ActionItem): item is DataItem {
  return 'active' in item && 'kind' in item;
}

interface OverviewState {
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
    <div className={grow}>
      <Button icon="undo" onClick={refreshOverview} />
      <table>
        <thead className={headerStyle}>
          <tr>
            <td rowSpan={2}>Team</td>
            {!overviewState && <td rowSpan={2}>Impact</td>}
            {overviewState?.header &&
              overviewState.header.map((h, i) => (
                <td key={h.title + i} colSpan={h.span}>
                  {h.title}
                </td>
              ))}
            <td rowSpan={2}>Actions</td>
          </tr>
          <tr>
            {overviewState?.row.map(r => (
              <td id={'header' + r.id}>{r.label}</td>
            ))}
          </tr>
        </thead>
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
      {(layoutState.showImpactModal || layoutState.showMailModal) && (
        <Modal onExit={() => setLayoutState(defaultLayoutState)}>
          {layoutState.showImpactModal ? <div>Impacts</div> : <div>Mail</div>}
        </Modal>
      )}
    </div>
  );
}
