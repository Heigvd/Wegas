import * as React from 'react';
import { Toolbar } from '../Toolbar';
import { themeCTX, Theme, ThemeValues, defaultThemeValues } from './Theme';
import { cx, css } from 'emotion';
import {
  flex,
  grow,
  flexRow,
  flexColumn,
  expandBoth,
  flexDistribute,
  expandHeight,
  autoScroll,
  itemCenter,
  defaultPadding,
  headerStyle,
  contentStyle,
} from '../../css/classes';
import { ColorChangeHandler, ChromePicker } from 'react-color';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { IconButton } from '../Inputs/Buttons/IconButton';
import { Menu } from '../Menu';
import { TextPrompt } from '../../Editor/Components/TextPrompt';
import { ConfirmButton } from '../Inputs/Buttons/ConfirmButton';
import { MessageString } from '../../Editor/Components/MessageString';
import { themeVar, ModeComponents, ModeComponentNames } from './ThemeVars';
import { MainLinearLayout } from '../../Editor/Components/LinearTabLayout/LinearLayout';
import {
  FonkyFlexContainer,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from '../Layouts/FonkyFlex';
import { SimpleInput } from '../Inputs/SimpleInput';
import { PageExamples } from './PageExample';
import { wlog } from '../../Helper/wegaslog';
import { InputConfirm } from '../Inputs/String/InputConfirm';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

const borderStyle = {
  borderStyle: 'inset',
  borderColor: themeVar.Common.colors.BorderColor,
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
};

const colorButton = css({
  width: '100%',
  ...borderStyle,
  cursor: 'pointer',
  padding: '2px',
});

const valueEntryStyle = css({
  marginBottom: '10px',
});

const valueStyle = css({
  marginTop: '1px',
});

const colorInnerButton = (color: string) =>
  css({
    height: '1.6em',
    backgroundColor: color,
  });

const modeColorSelectorSample = css({
  ...borderStyle,
  borderWidth: '2px',
  minWidth: '12px',
  minHeight: '12px',
  marginLeft: '5px',
});

interface ThemeEditorContextValues {
  editedThemeName: string;
  setEditedThemeName: React.Dispatch<React.SetStateAction<string>>;
}

export const themeEditorCTX = React.createContext<ThemeEditorContextValues>({
  editedThemeName: 'default',
  setEditedThemeName: () => wlog('Not implemented yet'),
});

interface MyColorPickerProps {
  color: string;
  onChange?: ColorChangeHandler;
}

function MyColorPicker({ color, onChange }: MyColorPickerProps) {
  const [displayed, setDisplayed] = React.useState(false);
  const pickerZone = React.useRef(null);
  useOnClickOutside(pickerZone, () => {
    setDisplayed(false);
  });

  return (
    <div className={cx(flex, colorButton)} ref={pickerZone}>
      <div
        className={cx(colorInnerButton(color), valueStyle, grow)}
        onClick={() => setDisplayed(old => !old)}
      />
      {displayed && (
        <ChromePicker
          // className={grow}
          color={color}
          onChangeComplete={onChange}
        />
      )}
    </div>
  );
}

type SimpleModes = 'close' | 'new';

interface ThemeValueModifierProps {
  theme: Theme;
  section: keyof ThemeValues;
  onChange: (entry: string, value: string | null) => void;
}

function ThemeValueModifier({
  theme,
  section,
  onChange,
}: ThemeValueModifierProps) {
  const [modalState, setModalState] = React.useState<SimpleModes>('close');
  const [newValue, setNewValue] = React.useState<{
    name?: string;
    value: string;
  }>({ value: section === 'colors' ? 'black' : '' });

  const nameAllreadExists = Object.keys(theme.values[section]).includes(
    newValue.name || '',
  );

  return (
    <div className={cx(flex, flexColumn, expandHeight)}>
      <div className={cx(flex, itemCenter, flexDistribute, headerStyle)}>
        {modalState === 'close' ? (
          <IconButton
            icon="plus"
            label={`Add new ${section} value`}
            onClick={() => setModalState('new')}
            prefixedLabel
          />
        ) : (
          <div className={cx(flex, flexColumn)}>
            {nameAllreadExists && (
              <MessageString type="warning" value="This value already exists" />
            )}
            <div className={cx(flex, flexRow)}>
              <IconButton
                icon="arrow-left"
                onClick={() => setModalState('close')}
              />
              <div className={cx(grow, flex, flexColumn)}>
                <SimpleInput
                  placeholder="value name"
                  onChange={v =>
                    setNewValue(ov => ({ ...ov, name: String(v) }))
                  }
                />
                {section === 'colors' ? (
                  <MyColorPicker
                    color={newValue.value}
                    onChange={color => {
                      setNewValue(ov => ({ ...ov, value: color.hex }));
                    }}
                  />
                ) : (
                  <SimpleInput
                    value={newValue.value}
                    className={valueStyle}
                    onChange={v =>
                      setNewValue(ov => ({ ...ov, value: String(v) }))
                    }
                  />
                )}
              </div>
              <IconButton
                icon="save"
                disabled={newValue.name == null || nameAllreadExists}
                tooltip={
                  newValue.name == null ? 'You have to enter a name' : undefined
                }
                onClick={() => {
                  if (newValue.name != null && !nameAllreadExists) {
                    setModalState('close');
                    onChange(newValue.name, newValue.value);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className={cx(flex, grow, flexColumn, defaultPadding, autoScroll)}>
        {Object.entries(theme.values[section]).map(([k, v]) => (
          <div key={k} className={cx(flex, flexColumn, valueEntryStyle)}>
            <div className={cx(flex, flexRow)}>
              <label
                className={cx(css({ display: 'flex', alignItems: 'center' }))}
                htmlFor={k}
                title={k}
              >
                {k} :
              </label>
              {!Object.keys(defaultThemeValues[section]).includes(k) && (
                <IconButton icon="trash" onClick={() => onChange(k, null)} />
              )}
            </div>
            {section === 'colors' ? (
              <MyColorPicker
                color={(v as string) || 'black'}
                onChange={color => {
                  onChange(k, color.hex);
                }}
              />
            ) : (
              <SimpleInput
                className={valueStyle}
                value={v}
                onChange={v => onChange(k, String(v))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface NewCloseModal {
  type: 'close' | 'new';
}

interface ErrorModal {
  type: 'error';
  label?: string;
}

type ModalState = NewCloseModal | ErrorModal;

function ThemeEdition() {
  const {
    themesState,
    addNewTheme,
    deleteTheme,
    setSelectedTheme,
    setThemeValue,
  } = React.useContext(themeCTX);
  const { editedThemeName, setEditedThemeName } = React.useContext(
    themeEditorCTX,
  );

  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme['values']]?: boolean }
  >(
    Object.keys(themesState.themes[editedThemeName].values).reduce(
      (o, k: keyof Theme['values']) => ({ ...o, [k]: true }),
      {},
    ),
  );

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, flexDistribute, headerStyle)}>
        <InputConfirm
          label="Add a new theme"
          validator={value => {
            if (!value || value === '') {
              return 'The theme must have a name';
            } else if (Object.keys(themesState.themes).includes(value)) {
              return 'The theme allready exists';
            }
          }}
          forceInputValue
          onChange={value => {
            if (value != null) {
              addNewTheme(value);
              setEditedThemeName(value);
            }
          }}
        />
        <ConfirmButton
          label="Delete current theme"
          icon="trash"
          onAction={success => {
            if (success) {
              deleteTheme(editedThemeName);
              setEditedThemeName(old => {
                const newThemes = Object.keys(themesState.themes).filter(
                  k => k !== old,
                );
                if (newThemes.length === 0) {
                  return 'default';
                }
                return newThemes[0];
              });
            }
          }}
        />
        <Menu
          label={'Contexts'}
          items={Object.keys(themesState.selectedThemes).map(
            (k: keyof typeof themesState.selectedThemes) => ({
              value: k,
              label: (
                <>
                  <span style={{ minWidth: '100px' }}>{`${k}'s theme :`}</span>
                  <Menu
                    label={themesState.selectedThemes[k]}
                    items={Object.keys(themesState.themes).map(k => ({
                      value: k,
                      label: k,
                    }))}
                    onSelect={({ value }) => setSelectedTheme(value, k)}
                  />
                </>
              ),
            }),
          )}
          onSelect={() => {}}
        />
        <Menu
          label={'Theme editor content'}
          items={Object.keys(themesState.themes[editedThemeName].values).map(
            (k: keyof Theme['values']) => ({
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
            }),
          )}
          onSelect={({ value: k }) =>
            setSelectedSection(o => ({ ...o, [k]: !o[k] }))
          }
        />
      </Toolbar.Header>
      <Toolbar.Content className={contentStyle}>
        <FonkyFlexContainer className={expandBoth}>
          {selectedSection.colors && (
            <FonkyFlexContent>
              <ThemeValueModifier
                theme={themesState.themes[editedThemeName]}
                section="colors"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'colors', k, v)
                }
              />
            </FonkyFlexContent>
          )}
          {selectedSection.colors &&
            (selectedSection.dimensions || selectedSection.others) && (
              <FonkyFlexSplitter />
            )}
          {selectedSection.dimensions && (
            <FonkyFlexContent>
              <ThemeValueModifier
                theme={themesState.themes[editedThemeName]}
                section="dimensions"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'dimensions', k, v)
                }
              />
            </FonkyFlexContent>
          )}
          {selectedSection.dimensions && selectedSection.others && (
            <FonkyFlexSplitter />
          )}
          {selectedSection.others && (
            <FonkyFlexContent>
              <ThemeValueModifier
                theme={themesState.themes[editedThemeName]}
                section="others"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'others', k, v)
                }
              />
            </FonkyFlexContent>
          )}
        </FonkyFlexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}

interface ModeColorValueProps {
  label: string;
  theme: Theme;
}

function ModeColorValue({ label, theme }: ModeColorValueProps) {
  return (
    <div className={cx(flex, itemCenter)}>
      {label}
      <div
        className={modeColorSelectorSample}
        style={{ backgroundColor: theme.values.colors[label] }}
      ></div>
    </div>
  );
}

interface ModeValueModifierProps {
  theme: Theme;
  component: ModeComponents;
  section: keyof ThemeValues;
  onChange: (entry: string, value: string) => void;
}

function ModeValueModifier({
  theme,
  component,
  section,
  onChange,
}: ModeValueModifierProps) {
  return (
    <div className={cx(flex, flexColumn)}>
      {Object.entries(component[section as keyof typeof component]).map(
        ([k, v]) => (
          <div key={k} className={cx(flex, flexRow)}>
            <label
              className={cx(css({ display: 'flex', alignItems: 'center' }))}
              htmlFor={k}
              title={k}
            >
              {k} :
            </label>
            <Menu
              label={
                section === 'colors' ? (
                  <ModeColorValue label={v} theme={theme} />
                ) : (
                  v
                )
              }
              items={Object.keys(theme.values[section]).map(k => ({
                value: k,
                label:
                  section === 'colors' ? (
                    <ModeColorValue label={k} theme={theme} />
                  ) : (
                    k
                  ),
              }))}
              onSelect={({ value }) => onChange(k, value)}
            />
          </div>
        ),
      )}
    </div>
  );
}

function ModeEdition() {
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });

  const {
    themesState,
    addNewMode,
    deleteMode,
    setModeValue,
  } = React.useContext(themeCTX);

  const { editedThemeName } = React.useContext(themeEditorCTX);

  const [editedMode, setEditedMode] = React.useState<string>('light');

  const [editedComponent, setEditedComponent] = React.useState<
    ModeComponentNames
  >('Common');
  const [editedSection, setEditedSection] = React.useState<keyof ThemeValues>(
    'colors',
  );

  const currentModes = themesState.themes[editedThemeName].modes;
  const currentComponents = currentModes[editedMode].values;
  const currentSections = currentComponents[editedComponent];

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, flexDistribute, headerStyle)}>
        {modalState.type === 'new' ? (
          <TextPrompt
            placeholder="Mode name"
            defaultFocus
            onAction={(success, value) => {
              if (value === '') {
                setModalState({
                  type: 'error',
                  label: 'The mode must have a name',
                });
              } else {
                if (success) {
                  addNewMode(editedThemeName, value);
                  setEditedMode(value);
                  setModalState({ type: 'close' });
                }
              }
            }}
            onBlur={() => setModalState({ type: 'close' })}
            applyOnEnter
          />
        ) : (
          <>
            <IconButton
              icon="plus"
              label="Add a new mode"
              prefixedLabel
              onClick={() => setModalState({ type: 'new' })}
            />

            <div className={flex}>
              <Menu
                label={`Mode : ${editedMode}`}
                items={Object.keys(currentModes).map(k => ({
                  value: k,
                  label: k,
                }))}
                onSelect={({ value }) => setEditedMode(value)}
              />
              <ConfirmButton
                icon="trash"
                tooltip="Delete the mode"
                onAction={success => {
                  if (success) {
                    deleteMode(editedThemeName, editedMode);
                    setEditedMode(old => {
                      const newModes = Object.keys(currentModes).filter(
                        k => k !== old,
                      );
                      if (newModes.length === 0) {
                        return 'light';
                      }
                      return newModes[0];
                    });
                  }
                }}
                onBlur={() => setModalState({ type: 'close' })}
              />
            </div>
          </>
        )}
        <Menu
          label={`Component : ${editedComponent}`}
          items={Object.keys(currentComponents).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) =>
            setEditedComponent(value as ModeComponentNames)
          }
        />
        <Menu
          label={`Section : ${editedSection}`}
          items={Object.keys(currentSections).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) => setEditedSection(value as keyof ThemeValues)}
        />
      </Toolbar.Header>
      <Toolbar.Content className={contentStyle}>
        <FonkyFlexContainer className={expandBoth}>
          <FonkyFlexContent>
            <ModeValueModifier
              theme={themesState.themes[editedThemeName]}
              component={currentComponents[editedComponent]}
              section={editedSection}
              onChange={(k, v) =>
                setModeValue(
                  editedThemeName,
                  editedMode,
                  editedComponent,
                  editedSection,
                  k,
                  v,
                )
              }
            />
          </FonkyFlexContent>
          <FonkyFlexSplitter />
          <FonkyFlexContent>
            <PageExamples modeName={editedMode} />
          </FonkyFlexContent>
        </FonkyFlexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ThemeEditor() {
  const { themesState } = React.useContext(themeCTX);
  const [editedTheme, setEditedTheme] = React.useState<string>(
    themesState.selectedThemes['editor'],
  );
  return (
    <themeEditorCTX.Provider
      value={{
        editedThemeName: editedTheme,
        setEditedThemeName: setEditedTheme,
      }}
    >
      <MainLinearLayout
        tabs={{
          Themes: <ThemeEdition />,
          Modes: <ModeEdition />,
        }}
        layout={['Themes', 'Modes']}
        layoutId={THEME_EDITOR_LAYOUT_ID}
      />
    </themeEditorCTX.Provider>
  );
}
