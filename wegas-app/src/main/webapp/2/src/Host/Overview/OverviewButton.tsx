import { IconName } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { globals } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';

interface OverviewButtonProps {
  team?: ITeam;
  label: string;
  icon: string | undefined;
  fn: string;
}

export function OverviewButton({ team, label, icon, fn }: OverviewButtonProps) {
  const actionFn = `return (${fn})(team,payload)`;
  const formattedFunction = globals.Function(
    'team',
    'payload',
    actionFn,
  )(team, undefined);

  return (
    <Button
      tooltip={label}
      icon={
        icon == null || icon === 'fa fa-pencil' ? 'pen' : (icon as IconName)
      }
      onClick={() => formattedFunction(team, undefined)}
    />
  );
}
