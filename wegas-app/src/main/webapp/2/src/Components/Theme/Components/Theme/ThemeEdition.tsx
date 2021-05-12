import { cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  flex,
  contentStyle,
  expandBoth,
  flexColumn,
  justifyEnd,
} from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  setThemeValue,
} from '../../../../data/Stores/themeStore';
import { DropMenu } from '../../../DropMenu';
import { Toolbar } from '../../../Toolbar';
import { Theme } from '../../ThemeVars';
import { ThemeValueModifier } from './ThemeValueModifier';

export function ThemeEdition() {
  const { themes, editedThemeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const currentTheme = themes[editedThemeName];
  const editedValues = currentTheme?.values || {};

  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme['values']]?: boolean }
  >({ colors: true, dimensions: false, others: false });

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, justifyEnd)}>
        <DropMenu
          icon="cog"
          items={[
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
                    >
                      <input
                        type="checkbox"
                        checked={selectedSection[k]}
                        onChange={() =>
                          setSelectedSection(o => ({ ...o, [k]: !o[k] }))
                        }
                        onClick={e => e.stopPropagation()}
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
