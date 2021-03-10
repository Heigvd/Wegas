import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { themeVar } from '../../Components/Style/ThemeVars';
import {
  ActionItem,
  DataItem,
  DataObjectType,
  DataType,
  isDataItem,
} from './Overview';
import { OverviewButton } from './OverviewButton';

export const fixedCellWidth = css({
  width: '180px',
});

export const fixedCellStyle = cx(
  css({
    position: 'absolute',
  }),
  fixedCellWidth,
);

export const firstScrollCellStyle = css({
  borderLeft: '180px solid transparent',
});
interface OverviewCellProps {
  team: ITeam;
  structure: DataItem | ActionItem;
  data: DataType;
  className?: string;
}

export function OverviewCell({
  structure,
  data,
  className,
}: OverviewCellProps) {
  const [showPopup, setShowPopup] = React.useState(false);

  if (isDataItem(structure)) {
    const { kind } = structure;
    switch (kind) {
      case 'boolean':
      case 'number':
      case 'string':
        return <td className={className}>{String(data)}</td>;
      case 'inbox':
        return (
          <td>
            <Button
              tooltip="Read mails"
              icon="envelope"
              onClick={() => setShowPopup(o => !o)}
            />
            {showPopup && (
              <div
                style={{
                  position: 'fixed',
                  backgroundColor: themeVar.Common.colors.BackgroundColor,
                  boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.3)',
                  padding: '10px',
                }}
                onClick={() => setShowPopup(false)}
              >
                <HTMLText text={(data as DataObjectType).body} />
              </div>
            )}
          </td>
        );
      case 'text':
      case 'object':
        return <td className={className}>{JSON.stringify(data)}</td>;
      default:
        throw Error('Unknown kind of value to display');
    }
  } else {
    const { ['do']: fn, icon = 'pen', label } = structure;
    return (
      <td className={className}>
        <OverviewButton label={label} icon={icon} fn={fn} />
      </td>
    );
  }
}
