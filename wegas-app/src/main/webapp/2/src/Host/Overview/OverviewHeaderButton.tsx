import { IconName } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { clientScriptEval } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';

interface OverviewButtonProps {
  label: string;
  icon: string | undefined;
  fn: string;
}

export function OverviewButton({ label, icon, fn }: OverviewButtonProps) {
  return (
    <Button
      tooltip={label}
      icon={
        icon == null || icon === 'fa fa-pencil' ? 'pen' : (icon as IconName)
      }
      onClick={() => clientScriptEval(fn)}
    />
  );
}
