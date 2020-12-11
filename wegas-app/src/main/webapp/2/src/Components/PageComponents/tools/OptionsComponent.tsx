import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { useComputeUnreadCount } from './options';
import { PlayerInfoBulletProps } from './InfoBullet';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { themeCTX } from '../../Style/Theme';
import { WegasComponentOptions } from './EditableComponent';
import { useStore } from '../../../data/store';
import { State } from '../../../data/Reducer/reducers';

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
  innerClassName?: string;
  outerClassName?: string;
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
  const lockedSelector = React.useCallback(
    (s: State) => lock != null && s.global.locks[lock] === true,
    [lock],
  );
  const locked = useStore(lockedSelector);

  const infoBulletProps = useComputeUnreadCount(unreadCount) || infoBullet;

  const { themesState, currentContext } = React.useContext(themeCTX);
  const themeModeClassName =
    themeMode == null
      ? undefined
      : themesState.themes[themesState.selectedThemes[currentContext]]
          .modeClasses[themeMode];

  const conditionnalClasses = useScript<boolean[]>(
    conditionnalClassNames.map(item => item.condition),
    context,
  )!
    .map((condition, i) => ({
      condition,
      applyOn: conditionnalClassNames[i].applyOn,
      className: conditionnalClassNames[i].className,
    }))
    .filter(item => item.condition);

  const innerClassName = conditionnalClasses
    .filter(item => item.applyOn == null || item.applyOn === 'Inside')
    .map(item => item.className)
    .join(' ');
  const outerClassName = conditionnalClasses
    .filter(item => item.applyOn === 'Outside')
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
    innerClassName,
    outerClassName,
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
