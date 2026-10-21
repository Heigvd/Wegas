import { cx } from '@emotion/css';
import * as React from 'react';
import { ReflexElement, ReflexSplitter, ReflexContainer } from 'react-reflex';
import {
  flex,
  contentStyle,
  justifyEnd,
  flexRow,
  itemCenter,
  defaultPadding,
} from '../../../../css/classes';
import { borderBottom } from '../../../../Editor/Components/FormView/commonView';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { DropMenu } from '../../../DropMenu';
import { CheckBox } from '../../../Inputs/Boolean/CheckBox';
import { Toolbar } from '../../../Toolbar';
import { ThemeValues, Theme } from '../../ThemeVars';
import { ModeValueModifier } from './ModeValueModifier';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { ModeValueArg, setModeValue, setNextMode } from '../../../../store/slices/theme';

export function ModeEdition() {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const { themes, editedThemeName, editedModeName } = useAppSelector(s => s.themes, shallowEqual);
  const dispatch = useAppDispatch();

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
      [section]: [keyof ThemeValues, boolean],
      i: number,
      a: [keyof ThemeValues, boolean][],
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
                // ModeValueModifier's onChange hands over a bare string entry
                // name, and `section` here is the whole union rather than a
                // literal, so this cast is what turns that string into the
                // section's key union. The thunk still rejects a genuinely wrong
                // {section, key, value} combination from every other call site.
                setModeValue({ section, key: k, value: v } as ModeValueArg),
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
    <Toolbar className={defaultPadding}>
      <Toolbar.Header className={cx(flex, justifyEnd, borderBottom)}>
        <DropMenu
          icon="cog"
          items={[
            {
              label:
                i18nValues.themeEditor.nextMode + currentMode?.nextModeName,
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
              label: i18nValues.themeEditor.showSection,
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
                      {i18nValues.themeEditor.sections(k)}
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
