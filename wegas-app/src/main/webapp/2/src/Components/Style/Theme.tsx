import * as React from 'react';
import { css, cx } from 'emotion';
import { defaultThemesState, SelectedThemes, ThemesState } from './ThemeVars';
import { expandBoth } from '../../css/classes';
import { useThemeStore } from '../../data/Stores/themeStore';
import { wlog } from '../../Helper/wegaslog';

export interface ThemeComponent {
  modeName?: string;
}

export type ThemeContext = keyof SelectedThemes;

interface ThemeContextValues {
  themesState: ThemesState;
  currentMode?: string;
  currentContext: ThemeContext;
  themeRoot?: React.RefObject<HTMLDivElement>;
}

export const themeCTX = React.createContext<ThemeContextValues>({
  themesState: defaultThemesState,
  currentContext: 'editor',
});

const { Consumer, Provider } = themeCTX;

export function ThemeProvider({
  children,
  contextName,
  modeName,
}: React.PropsWithChildren<{ contextName: ThemeContext } & ThemeComponent>) {
  const themeRoot = React.useRef<HTMLDivElement>(null);

  const themesState = useThemeStore(s => s);

  const className = themeModeClass(themesState, contextName, modeName);

  wlog(className);

  return (
    <div ref={themeRoot} className={cx(className, expandBoth)}>
      <Provider
        value={{
          themesState: themesState,
          currentMode: modeName,
          currentContext: contextName,
          themeRoot,
        }}
      >
        {children}
      </Provider>
    </div>
  );
}
export { Consumer as ThemeRoot };

function themeModeClass(
  themesState: ThemesState,
  contextName: ThemeContext,
  modeName?: string,
) {
  const currentTheme =
    themesState.themes[themesState.selectedThemes[contextName]];
  const computedModeName = modeName ? modeName : currentTheme.baseMode;
  return currentTheme.modeClasses[computedModeName];
}

/**
 * useModeClass - a hook that returns the selector for defining mode variables
 * @param modeName The name of the mode
 * @returns  the selector of the rule containing mode variables or an empty string if modeName is undefined
 */
export function useModeClass(modeName: string | undefined) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];
  return modeName ? currentTheme.modeClasses[modeName] : '';
}

/**
 * useModeSwitch - a hook that allows switching to next mode
 * @param modeName The name of the targeted mode
 * @param children The React children node
 * @returns currentModeClassName: the className for current mode rules.
 *          childrenModeClassName: the className for the children mode rules.
 *          childrenNode: the new children node that must be used instead of the one given in the functions.
 *          switcher: a switcher that must be placed in the ref prop of a DivElement.
 */
export function useModeSwitch(
  modeName: string | undefined,
  children: React.ReactNode,
) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];
  const [
    { currentModeName, nextModeName },
    setCurrentModeNames,
  ] = React.useState<{
    currentModeName?: string;
    nextModeName?: string;
  }>({});

  const [
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
  ] = React.useMemo(() => {
    const modeClassName = modeName
      ? currentTheme.modeClasses[modeName]
      : currentModeName
      ? currentTheme.modeClasses[currentModeName]
      : undefined;
    const nextModeClassName = modeName
      ? currentTheme.modeClasses[currentTheme.modes[modeName].nextModeName]
      : nextModeName
      ? currentTheme.modeClasses[nextModeName]
      : undefined;

    const currentClassName = modeClassName
      ? css({
          '&&': modeClassName,
        })
      : undefined;
    const childrenClassName = nextModeClassName
      ? css({
          '& *': nextModeClassName,
        })
      : undefined;
    return [
      currentClassName,
      childrenClassName,
      React.Children.map(children, (c, i) => (
        <React.Fragment key={childrenClassName || '' + i}>{c}</React.Fragment>
      )),
    ];
  }, [currentModeName, nextModeName, currentTheme, modeName, children]);

  const switcher = React.useCallback(
    (ref: HTMLElement | null) => {
      if (ref) {
        const newCurrentModeName = getComputedStyle(ref).getPropertyValue(
          '--current-mode-name',
        );
        const newNextModeName = getComputedStyle(ref).getPropertyValue(
          '--next-mode-name',
        );

        if (
          newCurrentModeName !== currentModeName ||
          newNextModeName !== nextModeName
        ) {
          setCurrentModeNames({
            currentModeName: newCurrentModeName,
            nextModeName: newNextModeName,
          });
        }
      }
    },
    [currentModeName, nextModeName],
  );

  return {
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
    switcher,
  };
}
