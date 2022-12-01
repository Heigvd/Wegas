import * as React from 'react';
import {
  ThemeProvider,
  ThemeComponent,
  themeCTX,
  useModeSwitch,
} from '../Components/Theme/Theme';
import { themeVar } from '../Components/Theme/ThemeVars';
import { css } from '@emotion/css';
import { classNameOrEmpty } from '../Helper/className';

const divStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.DarkTextColor,
  paddingLeft: '5px',
  paddingRight: '5px',
  paddingTop: '2px',
  paddingBottom: '2px',
  ':hover': {
    color: themeVar.colors.HoverTextColor,
    backgroundColor: themeVar.colors.HoverColor,
    outline: 'none',
  },
  ':focus': {
    outline: 'none',
  },
});

function ThemeDiv({
  modeName,
  label,
  children,
  className,
  style,
}: React.PropsWithChildren<
  ThemeComponent & { label?: React.ReactNode } & ClassStyleId
>) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];

  const [{ currentModeName, nextModeName }, setCurrentModeNames] =
    React.useState<{
      currentModeName?: string;
      nextModeName?: string;
    }>({
      /* currentModeName: modeName, nextModeName: computedNextModeName */
    });

  const [finalClassName, childrenNode] = React.useMemo(() => {
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

    const test = modeClassName
      ? css({
          '&&': modeClassName,
        })
      : undefined;
    const test2 = nextModeClassName
      ? css({
          '& *': nextModeClassName,
        })
      : undefined;
    const finalClassName =
      divStyle +
      classNameOrEmpty(test) +
      classNameOrEmpty(test2) +
      classNameOrEmpty(className);
    return [
      finalClassName,
      React.Children.map(children, (c, i) => (
        <React.Fragment key={finalClassName + i}>{c}</React.Fragment>
      )),
    ];
  }, [
    currentModeName,
    nextModeName,
    currentTheme,
    modeName,
    className,
    children,
  ]);

  return (
    <div
      ref={ref => {
        if (ref) {
          const newCurrentModeName = getComputedStyle(ref).getPropertyValue(
            '--current-mode-name',
          );
          const newNextModeName =
            getComputedStyle(ref).getPropertyValue('--next-mode-name');

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
      }}
      className={finalClassName}
      style={{ margin: '10px', borderStyle: 'solid', ...style }}
    >
      {label}
      {childrenNode}
    </div>
  );
}

function ThemeDivHooked({
  modeName,
  label,
  children,
  className,
  style,
}: React.PropsWithChildren<
  ThemeComponent & { label?: React.ReactNode } & ClassStyleId
>) {
  const {
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
    switcher,
  } = useModeSwitch(modeName, children);

  return (
    <div
      ref={switcher}
      className={
        divStyle +
        classNameOrEmpty(currentModeClassName) +
        classNameOrEmpty(childrenModeClassName) +
        classNameOrEmpty(className)
      }
      style={{ margin: '10px', borderStyle: 'solid', ...style }}
    >
      {label}
      {childrenNode}
    </div>
  );
}

export default function ThemeModeTester() {
  return (
    <ThemeProvider contextName="editor">
      <ThemeDiv modeName="dark">
        <ThemeDiv
          label="In da button!"
          //modeName="light"
        />
        <ThemeDiv>
          <ThemeDiv
            label="Not styled In da in da button!"
            //modeName="light"
          />
        </ThemeDiv>
        <ThemeDiv modeName="light">
          <ThemeDiv
            label="Styled In da in da button!"
            //modeName="light"
          />
        </ThemeDiv>
      </ThemeDiv>
      <ThemeDivHooked modeName="dark">
        <ThemeDivHooked
          label="In da button!"
          //modeName="light"
        />
        <ThemeDivHooked>
          <ThemeDivHooked
            label="Not styled In da in da button!"
            //modeName="light"
          />
        </ThemeDivHooked>
        <ThemeDivHooked modeName="light">
          <ThemeDivHooked
            label="Styled In da in da button!"
            //modeName="light"
          />
        </ThemeDivHooked>
      </ThemeDivHooked>
    </ThemeProvider>
  );
}
