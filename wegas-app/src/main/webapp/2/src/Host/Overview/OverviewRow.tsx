import { cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import HTMLEditor from '../../Components/HTMLEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { flex, flexRow, itemCenter } from '../../css/classes';
import { OverviewClickType, ActionItem, DataItem, DataType } from './Overview';
import {
  firstScrollCellStyle,
  fixedCellStyle,
  fixedCellWidth,
  OverviewCell,
} from './OverviewCell';

interface OverviewRowProps {
  team: ITeam;
  onClick: (type: OverviewClickType) => void;
  structure: (DataItem | ActionItem)[] | undefined;
  data: { [id: string]: DataType } | undefined;
}

export function OverviewRow({
  team,
  structure,
  data,
  onClick,
}: OverviewRowProps) {
  const [showPlayers, setShowPlayers] = React.useState(false);
  return (
    <>
      <tr>
        <td className={fixedCellStyle}>
          <div className={cx(flex, flexRow, itemCenter)}>
            <Button
              icon={showPlayers ? 'caret-down' : 'caret-right'}
              onClick={() => setShowPlayers(sp => !sp)}
            />
            <div>{team.name}</div>
          </div>
        </td>
        {!structure && (
          <td className={firstScrollCellStyle}>
            <Button
              icon="pen"
              tooltip="Execute impact"
              onClick={() => onClick('Impact')}
            />
          </td>
        )}
        {structure != null &&
          data != null &&
          structure.map((struct, i) => (
            <OverviewCell
              key={struct.id}
              data={data[struct.id]}
              structure={struct}
              team={team}
              className={cx({ [firstScrollCellStyle]: i === 0 })}
            />
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
      {showPlayers && (
        <tr>
          <td className={fixedCellWidth}>
            <ul>
              {team.players.map(player => (
                <li key={player.id}>{player.name}</li>
              ))}
            </ul>
          </td>
          <td colSpan={2 + (structure?.length || 1)}>
            <HTMLEditor />
          </td>
        </tr>
      )}
    </>
  );
}
