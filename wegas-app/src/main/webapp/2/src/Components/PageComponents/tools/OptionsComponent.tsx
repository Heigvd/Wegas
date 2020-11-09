import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { useComputeUnreadCount } from './options';
import { PlayerInfoBulletProps } from './InfoBullet';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { themeCTX } from '../../Style/Theme';
import { WegasComponentOptions } from './EditableComponent';
import { useStore } from '../../../data/store';

interface OptionProps {
  tooltip: WegasComponentOptions['tooltip'];
  disableIf: WegasComponentOptions['disableIf'];
  readOnlyIf: WegasComponentOptions['readOnlyIf'];
  hideIf: WegasComponentOptions['hideIf'];
  unreadCount: WegasComponentOptions['unreadCount'];
  infoBullet: WegasComponentOptions['infoBullet'];
  themeMode: WegasComponentOptions['themeMode'];
  lock: WegasComponentOptions['lock'];
  conditionnalClassNames: WegasComponentOptions['conditionnalClassNames'];
}

export const defaultOptions: (keyof OptionProps)[] = [
  'tooltip',
  'disableIf',
  'readOnlyIf',
  'hideIf',
  'unreadCount',
  'infoBullet',
  'themeMode',
  'lock',
  'conditionnalClassNames',
];

export interface OptionsState {
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  locked?: boolean;
  infoBulletProps?: PlayerInfoBulletProps;
  tooltip?: string;
  themeModeClassName?: string;
  conditionnalClassName?: string;
}

interface ComponentOptionsManagerProps {
  options: OptionProps;
  context?: {
    [name: string]: unknown;
  };
  setUpgradesState: (
    newState: (oldState: OptionsState) => OptionsState,
  ) => void;
}

export function ComponentOptionsManager({
  options,
  context,
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
    conditionnalClassNames = [],
  } = options;

  const disabled = useScript<boolean>(disableIf, context);
  const hidden = useScript<boolean>(hideIf, context);
  const readOnly = useScript<boolean>(readOnlyIf, context);
  const locked = useStore(s => lock != null && s.global.locks[lock] === true);

  const infoBulletProps = useComputeUnreadCount(unreadCount) || infoBullet;

  const { themesState, currentContext } = React.useContext(themeCTX);
  const themeModeClassName =
    themeMode == null
      ? undefined
      : themesState.themes[themesState.selectedThemes[currentContext]]
          .modeClasses[themeMode];

  const conditionnalClassName = useScript<boolean[]>(
    conditionnalClassNames.map(item => item.condition),
    context,
  )!
    .map((condition, i) => ({
      condition,
      className: conditionnalClassNames[i].className,
    }))
    .filter(item => item.condition)
    .map(item => item.className)
    .join(' ');

  const newUpgrades: OptionsState = {
    disabled,
    hidden,
    readOnly,
    locked,
    infoBulletProps,
    tooltip,
    themeModeClassName,
    conditionnalClassName,
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
