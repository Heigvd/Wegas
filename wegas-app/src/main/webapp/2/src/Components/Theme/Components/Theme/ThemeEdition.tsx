import { cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  flex,
  flexDistribute,
  headerStyle,
  contentStyle,
  expandBoth,
} from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  resetTheme,
  deleteTheme,
  setEditedTheme,
  addNewLib,
  setSelectedTheme,
  setThemeValue,
} from '../../../../data/Stores/themeStore';
import { DropMenu } from '../../../DropMenu';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { ConfirmStringAdder } from '../../../Inputs/String/ConfirmStringAdder';
import { Toolbar } from '../../../Toolbar';
import { Theme } from '../../ThemeVars';
import { ThemeValueModifier } from './ThemeValueModifier';

export function ThemeEdition() {
  const { themes, editedThemeName, selectedThemes } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const currentTheme = themes[editedThemeName];
  const editedValues = currentTheme?.values || {};

  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme['values']]?: boolean }
  >(
    Object.keys(editedValues).reduce(
      (o, k: keyof Theme['values']) => ({ ...o, [k]: true }),
      {},
    ),
  );

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, flexDistribute, headerStyle)}>
        <DropMenu
          label={`Theme : ${editedThemeName}`}
          selected={editedThemeName}
          items={Object.keys(themes).map(k => ({
            value: k,
            label: (
              <>
                {k}
                {k === 'default' || k === 'trainer' ? (
                  <ConfirmButton
                    icon="recycle"
                    tooltip="Reset"
                    onAction={success => success && dispatch(resetTheme(k))}
                  />
                ) : (
                  <ConfirmButton
                    icon="trash"
                    tooltip="Delete"
                    onAction={success => success && dispatch(deleteTheme(k))}
                  />
                )}
              </>
            ),
          }))}
          onSelect={({ value }) => {
            dispatch(setEditedTheme(value));
          }}
          adder={
            <ConfirmStringAdder
              label="Add a new theme"
              validator={value => {
                if (!value || value === '') {
                  return 'The theme must have a name';
                } else if (Object.keys(themes).includes(value)) {
                  return 'The theme allready exists';
                }
              }}
              forceInputValue
              onAccept={value => {
                if (value != null) {
                  dispatch(addNewLib(value));
                }
              }}
            />
          }
        />
        <DropMenu
          label={'Contexts'}
          items={Object.keys(selectedThemes).map(
            (k: keyof typeof selectedThemes) => ({
              value: k,
              label: (
                <>
                  <span style={{ minWidth: '100px' }}>{`${k}'s theme :`}</span>
                  <DropMenu
                    label={selectedThemes[k]}
                    items={Object.keys(themes).map(k => ({
                      value: k,
                      label: k,
                    }))}
                    onSelect={({ value }) => {
                      dispatch(setSelectedTheme(value, k));
                    }}
                  />
                </>
              ),
            }),
          )}
          onSelect={() => {}}
        />
        <DropMenu
          label={'Sections'}
          items={Object.keys(editedValues).map((k: keyof Theme['values']) => ({
            value: k,
            label: (
              <>
                <input
                  type="checkbox"
                  defaultChecked={selectedSection[k]}
                  onChange={() =>
                    setSelectedSection(o => ({ ...o, [k]: !o[k] }))
                  }
                  onClick={e => e.stopPropagation()}
                />
                {k}
              </>
            ),
          }))}
          onSelect={({ value: k }) =>
            setSelectedSection(o => ({ ...o, [k]: !o[k] }))
          }
        />
      </Toolbar.Header>
      <Toolbar.Content className={contentStyle}>
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
