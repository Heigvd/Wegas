import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { useComputeUnreadCount, WegasComponentExtra } from './options';
import { InfoBulletProps } from './InfoBullet';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { themeCTX } from '../../Style/Theme';
import { useStore } from '../../../data/store';

export interface ExtrasState {
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  locked?: boolean;
  infoBulletProps?: InfoBulletProps;
  tooltip?: string;
  themeModeClassName?: string;
}

interface ComponentExtrasManagerProps {
  extras: WegasComponentExtra;
  setExtrasState: (newState: (oldState: ExtrasState) => ExtrasState) => void;
}

export function ComponentExtrasManager({
  extras,
  setExtrasState,
}: ComponentExtrasManagerProps) {
  const {
    tooltip,
    disableIf,
    readOnlyIf,
    hideIf,
    unreadCount,
    infoBullet,
    themeMode,
    lock,
  } = extras;

  const disabled = useScript<boolean>(disableIf?.content);
  const hidden = useScript<boolean>(hideIf?.content);
  const readOnly = useScript<boolean>(readOnlyIf?.content);
  const locked = useStore(s => lock != null && s.global.locks[lock] === true);

  const infoBulletProps = useComputeUnreadCount(unreadCount) || infoBullet;

  const { themesState, currentContext } = React.useContext(themeCTX);
  const themeModeClassName =
    themeMode == null
      ? undefined
      : themesState.themes[themesState.selectedThemes[currentContext]]
          .modeClasses[themeMode];

  const newUpgrades: ExtrasState = {
    disabled,
    hidden,
    readOnly,
    locked,
    infoBulletProps,
    tooltip,
    themeModeClassName,
  };

  React.useEffect(() => {
    setExtrasState(oldUpgrades => {
      if (deepDifferent(oldUpgrades, newUpgrades)) {
        return newUpgrades;
      } else {
        return oldUpgrades;
      }
    });
  }, [setExtrasState, newUpgrades]);

  return null;
}
