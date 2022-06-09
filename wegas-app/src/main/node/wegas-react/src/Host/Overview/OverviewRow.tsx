import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import HTMLEditor from '../../Components/HTML/HTMLEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Validate } from '../../Components/Inputs/Validate';
import { themeVar } from '../../Components/Theme/ThemeVars';
import {
  flex,
  flexRow,
  hideWithEllipsis,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { Actions } from '../../data';
import { store } from '../../data/Stores/store';
import { wlog } from '../../Helper/wegaslog';
import EyeIcon from '../../pictures/icon_eye.svg';
import { ActionItem, DataItem, DataType, OverviewClickType } from './Overview';
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
      wlog('edit team');
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
        <td className={fixedCellStyle} title={team.getName() || ''}>
          <div className={cx(flex, flexRow, itemCenter) + ' team-cell'}>
            <Button
              icon={showPlayers ? 'caret-down' : 'caret-right'}
              onClick={() => setShowPlayers(sp => !sp)}
              className={css({ padding: '5px' })}
            />
            <p className={hideWithEllipsis}>{team.getName()}</p>
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
            <div
              className={css({
                '&:hover svg': { fill: themeVar.colors.ActiveColor },
              })}
              title="View playing session"
              onClick={() => onClick('Watch team')}
            >
              <EyeIcon
                className={css({ fill: themeVar.colors.PrimaryColor })}
              />
            </div>
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
              <Validate value={team.getNotes() || ''} onValidate={editTeam} onCancel={()=> {}}>
                {(value, onChange) => {
                  return (
                    <HTMLEditor
                      value={String(value)}
                      onChange={onChange}
                    />
                  );
                }}
              </Validate>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
