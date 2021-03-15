import { IconName } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { ActionItem, OverviewClickType } from './Overview';

interface OverviewButtonProps {
  onClick?: (type: OverviewClickType, item?: ActionItem) => void;
  item: ActionItem;
}

export function OverviewButton({  item, onClick }: OverviewButtonProps) {
  const { label, icon } = item;

  return (
    <Button
      tooltip={label}
      icon={
        icon == null || icon === 'fa fa-pencil' ? 'pen' : (icon as IconName)
      }
      onClick={() =>
        onClick && onClick('Impact', item)
      }
    />
  );
}
