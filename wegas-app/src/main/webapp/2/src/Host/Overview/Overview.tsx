import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Modal } from '../../Components/Modal';
import { themeVar } from '../../Components/Style/ThemeVars';
import { flex, flexColumn, flexRow, grow, itemCenter } from '../../css/classes';
// import { runScript } from '../data/Reducer/VariableInstanceReducer';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { GameModel, Player } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { createScript } from '../../Helper/wegasEntites';
import { wlog } from '../../Helper/wegaslog';

const tableStyle = css({
  display: "flex",
  color: "#828282",
  table: {
    borderCollapse: "separate",
    borderSpacing: "5px",
    td: {
      minWidth: "60px",
      padding: "15px 20px",
      backgroundColor: "#fff",
      boxShadow: "1px 2px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center"
    }
  },
  ".scroll": {
    width: "100%",
    overflowX: "auto",
    fontSize: "14px",
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
  },
  ".fixed": {
    color: "#626262",
    fontWeight: "bold",
    fontSize: "14px",
    "thead tr": {
      height: "55px",
      th: {
        backgroundColor: "transparent",
        boxShadow: "none",
        verticalAlign: "bottom",
        padding: "0",
        textAlign: "left"
      }
    },
    "tbody td": {
      borderRight: "3px solid #ababab",
      textAlign: "left",
      whiteSpace: "nowrap",
      maxWidth: "150px",
      overflow: "hidden"
    }
  }
});


interface CollapsibleTdProps {
  team: ITeam;
  key: number;
}

function CollapsibleTd({team, key}: CollapsibleTdProps){
  const [showPlayers, setShowPlayers] = React.useState(false);
  return (
    <td>
        <div>
          <Button
            icon={showPlayers ? 'caret-down' : 'caret-right'}
            onClick={() => setShowPlayers(sp => !sp)}
          />
          <div>{team.name}</div>
        </div>
        {showPlayers && (
          <div>
            <ul>
              {team.players.map(player => (
                <li key={player.id}>{player.name}</li>
              ))}
            </ul>
          </div>
        )}
    </td>
  );
}
interface OverviewRowProps {
  team: ITeam;
  onClick: (type: OverviewClickType) => void;
  key: string;
  nbColumns: number;
}

function OverviewRow({team, onClick, key, nbColumns }: OverviewRowProps) {
  const renderRegularTd = (arr:any) => {
    const sliceArr = arr.slice(nbColumns, arr.length);
    return sliceArr.map((e:any, index:number) => <td key={index}>{e}</td>);
  };
  return (
    <tr key={key}>
      {renderRegularTd(team)}
      <td>
        <Button
          icon="pen"
          tooltip="Execute impact"
          onClick={() => onClick('Impact')}
        />
      </td>
      <td>
        <div className={cx(flex, flexRow)}>
          <Button
            icon="envelope"
            tooltip="send mail"
            onClick={() => onClick('Mail')}
          />
          <Button
            icon="eye"
            tooltip="View playing session"
            onClick={() => onClick('Watch team')}
          />
        </div>
      </td>
    </tr>
  );
}

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

  // const overview = runScript('WegasDashboard.getOverview();');
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

  const table = Object.values(teams).map(team =>([
    team.id, team.name, team.players.length, team.players
  ]));
  const frozenColumns = 1;
  const headers = [
    "id", "name", "nb players", "Impacts", "Actions"
  ];
  const fixedHeaders = headers.slice(0, frozenColumns);
  const regularHeaders = headers.slice(frozenColumns, headers.length);

  const addTh = (arr:any) => {
    return arr.map((e:any, index:number) => <th key={index}>{e}</th>);
  };
  const renderFrozenTd = (arr:any[]) => {
    const sliceArr = arr.slice(0, fixedHeaders.length);
    return sliceArr.map((team:ITeam, index:number) => <CollapsibleTd team={team} key={index}/>);
  };
  const renderFrozen = (arr:any[]) => {
    return arr.map((e:any, index: number) => {
      return <tr key={index}>{renderFrozenTd(e)}</tr>;
    });
  };
  const renderRegular = (arr:any) => {
    return arr.map((team:ITeam, index:string) => {
      return <OverviewRow
        key={index}
        team={team}
        onClick={onRowClick}
        nbColumns={fixedHeaders.length}/>;
    });
  };
  return (
    <div className={grow}>
      <Button
        icon="undo"
        onClick={() =>
          VariableDescriptorAPI.runScript(
            GameModel.selectCurrent().id!,
            Player.selectCurrent().id!,
            createScript('WegasDashboard.getOverview();'),
            undefined,
            true,
          )?.then(res => wlog(res))
        }
      />
      <div className={tableStyle}>
        <table className="fixed">
          <thead>
            <tr>{addTh(fixedHeaders)}</tr>
          </thead>
          <tbody>{renderFrozen(table)}
          </tbody>
        </table>
        {/* <div className="scroll">
        <table className="scrollable">
          <thead>
            <tr>{addTh(regularHeaders)}</tr>
          </thead>
          <tbody>
            {renderRegular(table)}
            {Object.entries(table).map(([index, team]) => (
            <OverviewRow key={index} team={team} onClick={onRowClick} nbColumns={fixedHeaders.length} />
          ))}
          </tbody>
        </table>
      </div> */}
      </div>
      {/* <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Impact</th>
            <th>Actions</th>
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
            <OverviewRow key={id} team={team} onClick={onRowClick} />
          ))}
        </tbody>
      </table> */}
           {/*  <OverviewRow
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
      )}*/}
    </div>
  );
}
