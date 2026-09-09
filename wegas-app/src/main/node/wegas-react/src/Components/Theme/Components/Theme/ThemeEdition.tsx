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
import { Theme, ThemeValues } from '../../ThemeVars';
import { ThemeValueModifier } from './ThemeValueModifier';
import {
  customStateEquals,
  useAppDispatch,
  useAppSelector,
} from '../../../../store/hooks';
import { SectionValueArg, setThemeValue } from '../../../../store/slices/theme';

const EMPTY_VALUES = {};

export function ThemeEdition() {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const dispatch = useAppDispatch();

  const onValueChange = React.useCallback(
    function <
      T extends keyof ThemeValues,
      K extends keyof ThemeValues[T],
      V extends ThemeValues[T][K],
    >(section: T) {
      return function (key: K, value: V | null) {
        dispatch(
          setThemeValue({
            section,
            key,
            value,
          } as SectionValueArg<ThemeValues>),
        );
      };
    },
    [dispatch],
  );

  const { currentTheme, editedValues } = useAppSelector(s => {
    const currentTheme = s.themes.themes[s.themes.editedThemeName];
    return { currentTheme, editedValues: currentTheme?.values || EMPTY_VALUES };
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
                onChange={onValueChange('colors')}
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
                onChange={onValueChange('dimensions')}
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
                onChange={onValueChange('others')}
              />
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
