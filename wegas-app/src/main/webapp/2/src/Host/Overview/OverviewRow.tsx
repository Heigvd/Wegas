import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import HTMLEditor from '../../Components/HTMLEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import {
  flex,
  flexRow,
  grow,
  hideWithEllipsis,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { Actions } from '../../data';
import { store } from '../../data/Stores/store';
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

  const editTeam = React.useCallback(
    (value: string) => {
      const newTeam: ITeam = {
        ...team.getEntity(),
        notes: value,
      };
      store.dispatch(Actions.TeamActions.updateTeam(newTeam));
    },
    [team],
  );

  return (
    <>
      <tr>
        <td className={fixedCellStyle}>
          <div className={cx(flex, flexRow, itemCenter, justifyCenter)}>
            <Button
              icon={showPlayers ? 'caret-down' : 'caret-right'}
              onClick={() => setShowPlayers(sp => !sp)}
            />
            <div className={cx(flex, grow, justifyCenter, hideWithEllipsis)}>
              {team.getName()}
            </div>
          </div>
        </td>
        {!structure && (
          <td className={firstScrollCellStyle}>
            <div>
              <Button
                icon="pen"
                tooltip="Execute impact"
                onClick={() => onClick('Impact')}
              />
            </div>
          </td>
        )}
        {structure != null &&
          data != null &&
          structure.map((struct, i) => (
            <OverviewCell
              key={struct.id}
              data={data[struct.id]}
              structure={struct}
              className={cx({ [firstScrollCellStyle]: i === 0 })}
              onClick={onClick}
            />
          ))}
        <td>
          <div className={cx(flex, itemCenter, justifyCenter)}>
            <Button
              icon="envelope"
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
              <div
                className={css({
                  width: '180px',
                  height: '200px',
                  overflow: 'auto',
                })}
              >
                <ul>
                  {team.getPlayers().map(player => (
                    <li key={player.getId()}>{player.getName()}</li>
                  ))}
                </ul>
              </div>
              <div>
                <HTMLEditor
                  value={team.getNotes() || ''}
                  noResize
                  onSave={editTeam}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
