import { css, cx } from 'emotion';
import * as React from 'react';
import HTMLEditor from '../../Components/HTMLEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import {
  flex,
  flexRow,
  hideWithEllipsis,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { OverviewClickType, ActionItem, DataItem, DataType } from './Overview';
import {
  firstScrollCellStyle,
  fixedCellStyle,
  OverviewCell,
} from './OverviewCell';

interface OverviewRowProps {
  team: STeam;
  onClick: (type: OverviewClickType, item?: ActionItem) => void;
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
          <div className={cx(flex, flexRow, itemCenter, justifyCenter)}>
            <Button
              icon={showPlayers ? 'caret-down' : 'caret-right'}
              onClick={() => setShowPlayers(sp => !sp)}
            />
            <div className={hideWithEllipsis}>
              {team.getName()}kjkjdksholalala lala
            </div>
          </div>
        </td>
        {!structure && (
          <td className={firstScrollCellStyle}>
            <Button
              src={require('../../pictures/icon_edit.svg').default}
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
              onClick={onClick}
            />
          ))}
        <td>
          <div className={cx(flex, itemCenter, justifyCenter)}>
            <Button
              src={require('../../pictures/icon_mail.svg').default}
              tooltip="Send mail"
              onClick={() => onClick('Mail')}
            />
          </div>
        </td>
        <td>
          <div className={cx(flex, itemCenter, justifyCenter)}>
            <Button
              src={require('../../pictures/icon_eye.svg').default}
              tooltip="View playing session"
              onClick={() => onClick('Watch team')}
            />
          </div>
        </td>
      </tr>
      {showPlayers && (
        <tr className={'collapse'}>
          <td colSpan={3 + (structure?.length || 1)}>
            <div className={cx(flex, flexRow)}>
              <div className={css({ width: '180px' })}>
                <ul>
                  {team.getPlayers().map(player => (
                    <li key={player.getId()}>{player.getName()}</li>
                  ))}
                </ul>
              </div>
              <div>
                <HTMLEditor />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
