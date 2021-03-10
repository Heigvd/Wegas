import { css, cx } from 'emotion';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
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
  structure,
  data,
  className,
}: OverviewCellProps) {
  if (isDataItem(structure)) {
    const { kind } = structure;
    switch (kind) {
      case 'boolean':
      case 'number':
      case 'string':
        return <td className={className}>{String(data)}</td>;
      case 'inbox':
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
