import { cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { flex, flexRow, itemCenter } from '../../css/classes';
import { OverviewClickType, ActionItem, DataItem } from './Overview';

interface OverviewRowProps {
  team: ITeam;
  onClick: (type: OverviewClickType) => void;
  structure: (DataItem | ActionItem)[] | undefined;
  data: { [id: string]: unknown } | undefined;
}

export function OverviewRow({
  team,
  structure,
  data,
  onClick,
}: OverviewRowProps) {
  const [showPlayers, setShowPlayers] = React.useState(false);
  return (
    <tr>
      <td>
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
      {!structure && (
        <td>
          <Button
            icon="pen"
            tooltip="Execute impact"
            onClick={() => onClick('Impact')}
          />
        </td>
      )}
      {structure != null &&
        data != null &&
        structure.map(si => (
          <td key={'row' + si.id}>{JSON.stringify(data[si.id])}</td>
        ))}
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
