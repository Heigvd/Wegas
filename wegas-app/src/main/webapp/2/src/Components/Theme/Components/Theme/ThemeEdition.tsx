import { cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  flex,
  contentStyle,
  expandBoth,
  flexColumn,
  justifyEnd,
  flexRow,
  itemCenter,
  defaultPadding,
} from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  setThemeValue,
} from '../../../../data/Stores/themeStore';
import { borderBottom } from '../../../../Editor/Components/FormView/commonView';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { internalTranslate } from '../../../../i18n/internalTranslator';
import { languagesCTX } from '../../../Contexts/LanguagesProvider';
import { DropMenu } from '../../../DropMenu';
import { CheckBox } from '../../../Inputs/Boolean/CheckBox';
import { Toolbar } from '../../../Toolbar';
import { Theme } from '../../ThemeVars';
import { ThemeValueModifier } from './ThemeValueModifier';

export function ThemeEdition() {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);
  const { themes, editedThemeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const currentTheme = themes[editedThemeName];
  const editedValues = currentTheme?.values || {};

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
                onChange={(k, v) => {
                  dispatch(setThemeValue('colors', k, v));
                }}
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
                onChange={(k, v) => dispatch(setThemeValue('dimensions', k, v))}
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
                onChange={(k, v) => dispatch(setThemeValue('others', k, v))}
              />
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
