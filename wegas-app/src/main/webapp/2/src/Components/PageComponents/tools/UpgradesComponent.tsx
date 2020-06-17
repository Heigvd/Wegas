import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { WegasComponentUpgrades, useComputeUnreadCount } from './options';
import { InfoBeamProps } from './InfoBeam';
import { deepDifferent } from '../../Hooks/storeHookFactory';

export interface UpgradesState {
  disabled?: boolean;
  show?: boolean;
  infoBeamProps?: InfoBeamProps;
  tooltip?: string;
}

interface ComponentUpgradesManagerProps {
  upgrades: WegasComponentUpgrades;
  setUpgradesState: (
    newState: (oldState: UpgradesState) => UpgradesState,
  ) => void;
}

export function ComponentUpgradesManager({
  upgrades,
  setUpgradesState,
}: ComponentUpgradesManagerProps) {
  const { tooltip, disableIf, showIf, unreadCount, infoBeam } = upgrades;

  const disabled = useScript<boolean>(disableIf?.content || 'false');
  const show = useScript<boolean>(showIf?.content || 'true;');
  const infoBeamProps = useComputeUnreadCount(unreadCount) || infoBeam;
  const newUpgrades: UpgradesState = {
    disabled,
    show,
    infoBeamProps,
    tooltip,
  };

  React.useEffect(() => {
    setUpgradesState(oldUpgrades => {
      if (deepDifferent(oldUpgrades, newUpgrades)) {
        return newUpgrades;
      } else {
        return oldUpgrades;
      }
    });
  }, [setUpgradesState, newUpgrades]);

  return null;
}
