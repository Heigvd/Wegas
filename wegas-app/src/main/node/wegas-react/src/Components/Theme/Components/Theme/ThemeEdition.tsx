import { cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  contentStyle,
  defaultPadding,
  expandBoth,
  flex,
  flexColumn,
  flexRow,
  itemCenter,
  justifyEnd,
} from '../../../../css/classes';
import { borderBottom } from '../../../../Editor/Components/FormView/commonView';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { DropMenu } from '../../../DropMenu';
import { CheckBox } from '../../../Inputs/Boolean/CheckBox';
import { Toolbar } from '../../../Toolbar';
import { Theme } from '../../ThemeVars';
import { ThemeValueModifier } from './ThemeValueModifier';
import { customStateEquals, useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setThemeValue, ThemeValueArgs } from '../../../../store/slices/theme';

export function ThemeEdition() {
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  const dispatch = useAppDispatch();

  // One closure per section: the literal `section` is what lets TS check the
  // payload against ThemeValueArg's union directly, with no cast.
  const onColorChange = React.useCallback(
    (
      key: ThemeValueArgs['colors']['key'],
      value: ThemeValueArgs['colors']['value'],
    ) => dispatch(setThemeValue({ section: 'colors', key, value })),
    [dispatch],
  );

  const onDimensionChange = React.useCallback(
    (
      key: ThemeValueArgs['dimensions']['key'],
      value: ThemeValueArgs['dimensions']['value'],
    ) => dispatch(setThemeValue({ section: 'dimensions', key, value })),
    [dispatch],
  );

  const onOtherChange = React.useCallback(
    (
      key: ThemeValueArgs['others']['key'],
      value: ThemeValueArgs['others']['value'],
    ) => dispatch(setThemeValue({ section: 'others', key, value })),
    [dispatch],
  );

  const { currentTheme, editedValues } = useAppSelector(s => {
    const currentTheme = s.themes.themes[s.themes.editedThemeName];
    return { currentTheme, editedValues: currentTheme?.values || {} };
  }, customStateEquals);

  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme['values']]?: boolean }
  >({ colors: true, dimensions: false, others: false });

  return (
    <Toolbar className={defaultPadding}>
      <Toolbar.Header className={cx(flex, justifyEnd, borderBottom)}>
        <DropMenu
          icon="cog"
          items={[
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
      <Toolbar.Content className={cx(flex, flexColumn, contentStyle)}>
        <ReflexContainer className={expandBoth} orientation="vertical">
          {selectedSection.colors && (
            <ReflexElement>
              <ThemeValueModifier
                theme={currentTheme}
                section="colors"
                onChange={onColorChange}
              />
            </ReflexElement>
          )}
          {selectedSection.colors &&
            (selectedSection.dimensions || selectedSection.others) && (
              <ReflexSplitter />
            )}
          {selectedSection.dimensions && (
            <ReflexElement>
              <ThemeValueModifier
                theme={currentTheme}
                section="dimensions"
                onChange={onDimensionChange}
              />
            </ReflexElement>
          )}
          {selectedSection.dimensions && selectedSection.others && (
            <ReflexSplitter />
          )}
          {selectedSection.others && (
            <ReflexElement>
              <ThemeValueModifier
                theme={currentTheme}
                section="others"
                onChange={onOtherChange}
              />
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
