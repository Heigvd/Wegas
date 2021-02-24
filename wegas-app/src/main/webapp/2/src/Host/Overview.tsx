import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../API/variableDescriptor.api';
import { Button } from '../Components/Inputs/Buttons/Button';
import { Modal } from '../Components/Modal';
import { themeVar } from '../Components/Style/ThemeVars';
import { flex, flexColumn, flexRow, grow, itemCenter } from '../css/classes';
// import { runScript } from '../data/Reducer/VariableInstanceReducer';
import { GameModel, Player } from '../data/selectors';
import { useStore } from '../data/Stores/store';
import { createScript } from '../Helper/wegasEntites';
import { wlog } from '../Helper/wegaslog';

const rowStyle = css({
  backgroundColor: themeVar.Common.colors.SecondaryBackgroundColor,
  marginBottom: '5px',
});

type OverviewClickType = 'Impact' | 'Mail' | 'Watch team';

interface OverviewRowProps {
  team: ITeam;
  onClick: (type: OverviewClickType) => void;
}

function OverviewRow({ team, onClick }: OverviewRowProps) {
  const [showPlayers, setShowPlayers] = React.useState(false);
  return (
    <tr className={cx(flex, flexRow, rowStyle)}>
      <td className={cx(flex, flexColumn)}>
        <div className={cx(flex, flexRow, itemCenter)}>
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

// const overviewStyle = css({
//   width:"100%",
// })

const defaultLayoutState = {
  showImpactModal: false,
  showMailModal: false,
};

export default function Overview() {
  const [layoutState, setLayoutState] = React.useState(defaultLayoutState);

  // const overview = runScript('WegasDashboard.getOverview();');

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
      <table>
        <thead>
          <tr>
            <td>Team</td>
            <td>Impact</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {Object.entries(teams).map(([id, team]) => (
            <OverviewRow key={id} team={team} onClick={onRowClick} />
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
