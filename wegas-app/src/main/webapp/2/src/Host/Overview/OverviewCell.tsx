import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { ActionItem, DataItem, DataType, isDataItem } from './Overview';
import { OverviewButton } from './OverviewHeaderButton';

interface OverviewCellProps {
  team: ITeam;
  structure: DataItem | ActionItem;
  data: DataType;
}

export function OverviewCell({ structure, data }: OverviewCellProps) {
  if (isDataItem(structure)) {
    const { kind } = structure;
    switch (kind) {
      case 'boolean':
      case 'number':
      case 'string':
        return <td>{String(data)}</td>;
      case 'inbox':
      case 'text':
      case 'object':
        return <td>{JSON.stringify(data)}</td>;
      default:
        throw Error('Unknown kind of value to display');
    }
  } else {
    const { ['do']: fn, icon = 'pen', label } = structure;
    return (
      <td>
        <OverviewButton label={label} icon={icon} fn={fn} />
      </td>
    );
  }
}
