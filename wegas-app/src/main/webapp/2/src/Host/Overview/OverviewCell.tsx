import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { globals } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { themeVar } from '../../Components/Style/ThemeVars';
import { ActionItem, DataItem, DataType, isDataItem } from './Overview';
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
  team,
  structure,
  data,
  className,
}: OverviewCellProps) {
  const [showPopup, setShowPopup] = React.useState(false);

  if (isDataItem(structure)) {
    const { kind, formatter } = structure;

    const view = formatter ? 'formatter' : kind;
    const value = typeof data === 'object' ? data.body : data;

    switch (view) {
      case 'boolean':
        return (
          <td>
            <img
              src={
                require(value === true
                  ? '../../pictures/icon_ok.svg'
                  : '../../pictures/icon_notok.svg').default
              }
            />
          </td>
        );
      case 'number':
      case 'string':
        return <td className={className}>{String(value)}</td>;
      case 'inbox':
        return (
          <td>
            <Button
              tooltip="Read mails"
              src={require('../../pictures/icon_mail.svg').default}
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
                <HTMLText text={String(value)} />
              </div>
            )}
          </td>
        );
      case 'text':
        return (
          <td>
            <HTMLText text={String(value)} />
          </td>
        );
      case 'object':
        return <td className={className}>{JSON.stringify(String(value))}</td>;
      case 'formatter': {
        const formatterFunction = `return (${formatter})(data)`;
        const formattedvalue = globals.Function(
          'data',
          formatterFunction,
        )(data);

        return (
          <td>
            <HTMLText text={String(formattedvalue)} />
          </td>
        );
      }

      default:
        throw Error('Unknown kind of value to display');
    }
  } else {
    const { ['do']: fn, icon = 'pen', label } = structure;

    return (
      <td className={className}>
        <OverviewButton label={label} icon={icon} fn={fn} team={team} />
      </td>
    );
  }
}