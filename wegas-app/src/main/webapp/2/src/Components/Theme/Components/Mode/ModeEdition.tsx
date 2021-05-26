import { cx } from 'emotion';
import * as React from 'react';
import { ReflexElement, ReflexSplitter, ReflexContainer } from 'react-reflex';
import {
  flex,
  contentStyle,
  justifyEnd,
  flexRow,
  itemCenter,
} from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  setModeValue,
  setNextMode,
} from '../../../../data/Stores/themeStore';
import { DropMenu } from '../../../DropMenu';
import { CheckBox } from '../../../Inputs/Boolean/CheckBox';
import { Toolbar } from '../../../Toolbar';
import { ThemeValues, ModeValues, Theme } from '../../ThemeVars';
import { ModeValueModifier } from './ModeValueModifier';

export function ModeEdition() {
  const { themes, editedThemeName, editedModeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof ThemeValues]?: boolean }
  >({ colors: true, dimensions: false, others: false });

  const currentTheme = themes[editedThemeName];
  const editedValues = currentTheme?.values || {};
  const currentModes = currentTheme?.modes || {};
  const currentMode = currentModes[editedModeName];

  const modeValueReducer = React.useCallback(
    (
      old: JSX.Element[],
      [section]: [keyof ValueOf<ModeValues>, boolean],
      i: number,
      a: [keyof ValueOf<ModeValues>, boolean][],
    ) => {
      const values = currentMode?.values || {};
      // const entries = Object.keys(component[section] || {});

      const content = (
        <ReflexElement key={section} /*flex={entries.length + 1}*/>
          <ModeValueModifier
            theme={currentTheme}
            section={section}
            values={values}
            onChange={(k, v) =>
              dispatch(
                // Type are becomming too complex here. We just have to rely on dev to send good values
                setModeValue(section, k as never, v as never),
              )
            }
          />
        </ReflexElement>
      );

      if (i < a.length - 1) {
        return [
          ...old,
          content,
          <ReflexSplitter key={`splitter_${section}`} />,
        ];
      } else {
        return [...old, content];
      }
    },
    [currentMode, currentTheme, dispatch],
  );

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, justifyEnd)}>
        <DropMenu
          icon="cog"
          items={[
            {
              label: `Next mode : ${currentMode?.nextModeName}`,
              value: 'nextMode',
              items: Object.keys(currentModes).map(k => ({
                value: k,
                label: (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      dispatch(setNextMode(k));
                    }}
                    className={cx(flex, flexRow, itemCenter)}
                  >
                    <CheckBox
                      radio
                      value={k === currentMode?.nextModeName}
                      onChange={() => {
                        dispatch(setNextMode(k));
                      }}
                    />
                    {k}
                  </div>
                ),
              })),
            },
            {
              label: 'Show section',
              value: 'showSection',
              items: Object.keys(editedValues).map(
                (k: keyof Theme['values']) => ({
                  value: `view-${k}`,
                  label: (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedSection(o => ({
                          ...o,
                          [k]: !o[k],
                        }));
                      }}
                      className={cx(flex, flexRow, itemCenter)}
                    >
                      <CheckBox
                        value={selectedSection[k]}
                        onChange={() =>
                          setSelectedSection(o => ({ ...o, [k]: !o[k] }))
                        }
                      />
                      {k}
                    </div>
                  ),
                }),
              ),
            },
          ]}
          onSelect={() => {}}
        />
      </Toolbar.Header>
      <Toolbar.Content className={contentStyle}>
        <ReflexContainer orientation="vertical">
          {Object.entries(selectedSection)
            .filter(([, v]) => v)
            .reduce<JSX.Element[]>(modeValueReducer, [])}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
