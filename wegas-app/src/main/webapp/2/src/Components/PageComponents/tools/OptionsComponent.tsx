import * as React from 'react';
import { State } from '../../../data/Reducer/reducers';
import { useStore } from '../../../data/Stores/store';
import { useScript } from '../../Hooks/useScript';
import { themeCTX } from '../../Theme/Theme';
import { WegasComponentOptions } from './EditableComponent';
import { PlayerInfoBulletProps } from './InfoBullet';
import { PageComponentContext, useComputeUnreadCount } from './options';

/**
 * Standard options of a wegas component and its container.
 *
 * They
 * - are set in the GUI "Component properties" tab
 * - are read in the PageDeserializer
 * - are used in the EditableComponent
 * - may be used specifically in each wegas component
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// options in their universal form
interface OptionProps {
  tooltip: WegasComponentOptions['tooltip'];
  themeMode: WegasComponentOptions['themeMode'];
  conditionnalClassNames: WegasComponentOptions['conditionnalClassNames'];
  disableIf: WegasComponentOptions['disableIf'];
  hideIf: WegasComponentOptions['hideIf'];
  readOnlyIf: WegasComponentOptions['readOnlyIf'];
  lock: WegasComponentOptions['lock'];
  infoBullet: WegasComponentOptions['infoBullet'];
  unreadCount: WegasComponentOptions['unreadCount'];
}

export const defaultOptionsKeys: (keyof OptionProps)[] = [
  'tooltip',
  'themeMode',
  'conditionnalClassNames',
  'disableIf',
  'hideIf',
  'readOnlyIf',
  'lock',
  'infoBullet',
  'unreadCount',
];

////////////////////////////////////////////////////////////////////////////////////////////////////
// options in their easy-to-use form, computed for a specific context

// options that can be passed from a parent to its children
export interface HeritableOptionsState {
  disabled?: boolean;
  readOnly?: boolean;
}

export const heritableOptionsStateKeys: (keyof HeritableOptionsState)[] = [
  'disabled',
  'readOnly',
];

export interface OptionsState extends HeritableOptionsState {
  tooltip?: string;
  themeModeClassName?: string;
  innerClassName?: string;
  outerClassName?: string;
  hidden?: boolean;
  locked?: boolean;
  infoBulletProps?: PlayerInfoBulletProps;
}

// interface ComponentOptionsManagerProps {
//   options: OptionProps;
//   context?: PageComponentContext;
//   setUpgradesState: (
//     newState: (oldState: OptionsState) => OptionsState,
//   ) => void;
// }

/**
 * UseOptions makes an easy-to-use and already computed OptionState specific to the context
 *
 * @param options Options in their universal form
 * @param context Context in which the options are handled
 * @param inheritedOptionsState Options' state inherited from the parent
 */
export function useOptions(
  options: OptionProps,
  context: PageComponentContext,
  inheritedOptionsState: HeritableOptionsState,
): OptionsState {
  const {
    tooltip,
    themeMode,
    conditionnalClassNames = [],
    disableIf,
    hideIf,
    readOnlyIf,
    lock,
    infoBullet,
    unreadCount,
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

  return React.useMemo(
    () => ({
      tooltip,
      themeModeClassName,
      innerClassName,
      outerClassName,
      disabled:
        disabled === undefined ? inheritedOptionsState.disabled : disabled,
      hidden,
      readOnly:
        readOnly === undefined ? inheritedOptionsState.readOnly : readOnly,
      locked,
      infoBulletProps,
    }),
    [
      disabled,
      hidden,
      infoBulletProps,
      inheritedOptionsState.disabled,
      inheritedOptionsState.readOnly,
      innerClassName,
      locked,
      outerClassName,
      readOnly,
      themeModeClassName,
      tooltip,
    ],
  );
}

// export function ComponentOptionsManager({
//   options,
//   context,
//   setUpgradesState,
// }: ComponentOptionsManagerProps) {
//   const {
//     tooltip,
//     disableIf,
//     readOnlyIf,
//     hideIf,
//     unreadCount,
//     infoBullet,
//     themeMode,
//     lock,
//     conditionnalClassNames = [],
//   } = options;

//   const disabled = useScript<boolean>(disableIf, context);
//   const hidden = useScript<boolean>(hideIf, context);
//   const readOnly = useScript<boolean>(readOnlyIf, context);
//   const lockedSelector = React.useCallback(
//     (s: State) => lock != null && s.global.locks[lock] === true,
//     [lock],
//   );
//   const locked = useStore(lockedSelector);

//   const infoBulletProps = useComputeUnreadCount(unreadCount) || infoBullet;

//   const { themesState, currentContext } = React.useContext(themeCTX);
//   const themeModeClassName =
//     themeMode == null
//       ? undefined
//       : themesState.themes[themesState.selectedThemes[currentContext]]
//           .modeClasses[themeMode];

//   const conditionnalClasses = useScript<boolean[]>(
//     conditionnalClassNames.map(item => item.condition),
//     context,
//   )!
//     .map((condition, i) => ({
//       condition,
//       applyOn: conditionnalClassNames[i].applyOn,
//       className: conditionnalClassNames[i].className,
//     }))
//     .filter(item => item.condition);

//   const innerClassName = conditionnalClasses
//     .filter(item => item.applyOn == null || item.applyOn === 'Inside')
//     .map(item => item.className)
//     .join(' ');
//   const outerClassName = conditionnalClasses
//     .filter(item => item.applyOn === 'Outside')
//     .map(item => item.className)
//     .join(' ');

//   const newUpgrades: OptionsState = {
//     disabled,
//     hidden,
//     readOnly,
//     locked,
//     infoBulletProps,
//     tooltip,
//     themeModeClassName,
//     innerClassName,
//     outerClassName,
//   };

//   React.useEffect(() => {
//     setUpgradesState(oldUpgrades => {
//       if (deepDifferent(oldUpgrades, newUpgrades)) {
//         return newUpgrades;
//       } else {
//         return oldUpgrades;
//       }
//     });
//   }, [setUpgradesState, newUpgrades]);

//   return null;
// }
