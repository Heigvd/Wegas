import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { WegasComponentUpgrades, useComputeUnreadCount } from './options';
import { InfoBeamProps } from './InfoBeam';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { themeCTX } from '../../Style/Theme';

export interface UpgradesState {
  disabled?: boolean;
  show?: boolean;
  infoBeamProps?: InfoBeamProps;
  tooltip?: string;
  themeModeClassName?: string;
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
  const {
    tooltip,
    disableIf,
    showIf,
    unreadCount,
    infoBeam,
    themeMode,
  } = upgrades;

  const disabled = useScript<boolean>(disableIf?.content || 'false');
  const show = useScript<boolean>(showIf?.content || 'true;');
  const infoBeamProps = useComputeUnreadCount(unreadCount) || infoBeam;

  const { themesState, currentContext } = React.useContext(themeCTX);
  const themeModeClassName =
    themeMode == null
      ? undefined
      : themesState.themes[themesState.selectedThemes[currentContext]]
          .modeClasses[themeMode];

  const newUpgrades: UpgradesState = {
    disabled,
    show,
    infoBeamProps,
    tooltip,
    themeModeClassName,
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
