import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { useComputeUnreadCount } from './options';
import { PlayerInfoBulletProps } from './InfoBullet';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { themeCTX } from '../../Style/Theme';
import { WegasComponentOptions } from './EditableComponent';
import { useStore } from '../../../data/store';

export interface OptionsState {
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  locked?: boolean;
  infoBulletProps?: PlayerInfoBulletProps;
  tooltip?: string;
  themeModeClassName?: string;
}

interface ComponentOptionsManagerProps {
  options: WegasComponentOptions;
  setUpgradesState: (
    newState: (oldState: OptionsState) => OptionsState,
  ) => void;
}

export function ComponentOptionsManager({
  options,
  setUpgradesState,
}: ComponentOptionsManagerProps) {
  const {
    tooltip,
    disableIf,
    readOnlyIf,
    hideIf,
    unreadCount,
    infoBullet,
    themeMode,
    lock,
  } = options;

  const disabled = useScript<boolean>(disableIf);
  const hidden = useScript<boolean>(hideIf);
  const readOnly = useScript<boolean>(readOnlyIf);
  const locked = useStore(s => lock != null && s.global.locks[lock] === true);

  const infoBulletProps = useComputeUnreadCount(unreadCount) || infoBullet;

  const { themesState, currentContext } = React.useContext(themeCTX);
  const themeModeClassName =
    themeMode == null
      ? undefined
      : themesState.themes[themesState.selectedThemes[currentContext]]
          .modeClasses[themeMode];

  const newUpgrades: OptionsState = {
    disabled,
    hidden,
    readOnly,
    locked,
    infoBulletProps,
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
