import { IconName } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { globals } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { ActionItem, OverviewClickType } from './Overview';

interface OverviewButtonProps {
  team?: STeam;
  onClick?: (type: OverviewClickType, item?: ActionItem) => void;
  item: ActionItem;
}

export function OverviewButton({ team, item, onClick }: OverviewButtonProps) {
  const { label, icon, ['do']: fn } = item;

  const actionFn = `return (${fn})(team,payload)`;
  const formattedFunction = globals.Function('team', 'payload', actionFn);

  return (
    <Button
      tooltip={label}
      icon={
        icon == null || icon === 'fa fa-pencil' ? 'pen' : (icon as IconName)
      }
      onClick={() =>
        onClick ? onClick('Impact', item) : formattedFunction(team, undefined)
      }
    />
  );
}
