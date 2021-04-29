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
  justifyCenter,
  componentMarginLeft,
  defaultMargin,
} from '../../css/classes';
import { ChromePicker, RGBColor } from 'react-color';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { DropMenu } from '../DropMenu';
import {
  themeVar,
  ModeComponents,
  ModeComponentNames,
  ModeColor,
  ModeDimension,
  ModeOther,
} from './ThemeVars';
import { MainLinearLayout } from '../../Editor/Components/LinearTabLayout/LinearLayout';
// import {
//   FonkyFlexContainer,
//   FonkyFlexContent,
//   FonkyFlexSplitter,
// } from '../Layouts/FonkyFlex';
import { SimpleInput } from '../Inputs/SimpleInput';
// import { PageExamples } from './PageExample';
import { wlog } from '../../Helper/wegaslog';
import { ConfirmStringAdder } from '../Inputs/String/ConfirmStringAdder';
import { Title } from '../Inputs/String/Title';
import { ConfirmAdder } from '../Inputs/String/ConfirmAdder';
import { Button } from '../Inputs/Buttons/Button';
import * as Color from 'color';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

const borderStyle = {
  borderStyle: 'solid',
  borderColor: themeVar.Common.colors.HeaderColor,
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
  marginBottom: '7px',
});

const valueStyle = css({
  marginTop: '1px',
});

const colorInnerButton = (color: string) =>
  css({
    height: '1.6em',
    backgroundColor: color,
  });

const modeColorSelectorSample = cx(
  css({
    ...borderStyle,
    borderWidth: '2px',
    minWidth: '12px',
    minHeight: '12px',
  }),
  componentMarginLeft,
);

interface ThemeEditorContextValues {
  editedThemeName: string;
  setEditedThemeName: React.Dispatch<React.SetStateAction<string>>;
}

export const themeEditorCTX = React.createContext<ThemeEditorContextValues>({
  editedThemeName: 'default',
  setEditedThemeName: () => wlog('Not implemented yet'),
});

function stringToRGBA(color?: string): RGBColor {
  const colorObject = Color(color);
  return {
    r: colorObject.red(),
    g: colorObject.green(),
    b: colorObject.blue(),
    a: colorObject.alpha(),
  };
}

function rgbaToString(color?: RGBColor): string {
  return `rgba(${color?.r || 0},${color?.g || 0},${color?.b || 0}${
    color?.a ? `,${color.a}` : ''
  })`;
}

interface MyColorPickerProps {
  initColor?: string;
  onChange?: (newColor: RGBColor) => void;
}

function MyColorPicker({ initColor = 'black', onChange }: MyColorPickerProps) {
  const [displayed, setDisplayed] = React.useState(false);
  const [color, setColor] = React.useState<RGBColor>(stringToRGBA(initColor));
  const pickerZone = React.useRef(null);

  React.useEffect(() => {
    setColor(stringToRGBA(initColor));
  }, [initColor]);

  useOnClickOutside(pickerZone, () => {
    setDisplayed(false);
  });

  return (
    <div className={cx(flex, colorButton, justifyCenter)} ref={pickerZone}>
      {!displayed ? (
        <div
          className={cx(
            colorInnerButton(rgbaToString(color)),
            valueStyle,
            grow,
          )}
          onClick={() => setDisplayed(old => !old)}
        />
      ) : (
        <div className={cx(flex, flexColumn, itemCenter)}>
          <ChromePicker
            color={color}
            onChangeComplete={newColor => {
              setColor(newColor.rgb);
            }}
          />
          <div style={{ margin: themeVar.Common.dimensions.BorderWidth }}>
            <Button
              label="Accept"
              onClick={() => {
                setDisplayed(false);
                onChange && onChange(color);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  const accept: (value?: {
    name?: string;
    value: string;
  }) => string | undefined = value =>
    value?.name == null || value.name === ''
      ? 'You have to enter a name'
      : undefined;

  const validator: (
    value?:
      | {
          name?: string;
          value: string;
        }
      | undefined,
  ) => string | undefined = value => {
    if (Object.keys(theme.values[section]).includes(value?.name || '')) {
      return `The ${section} value already exists`;
    }
  };

  return (
    <div className={cx(flex, flexColumn, expandHeight)}>
      <div className={cx(flex, itemCenter, flexDistribute, headerStyle)}>
        <ConfirmAdder
          label={`Add new ${section} value`}
          accept={accept}
          validator={validator}
          onAccept={value =>
            accept(value) &&
            validator(value) &&
            onChange(value!.name!, value!.value)
          }
        >
          {onNewValue => (
            <>
              <SimpleInput
                placeholder="value name"
                onChange={v =>
                  onNewValue(ov => ({
                    ...(ov || { value: 'black' }),
                    name: String(v),
                  }))
                }
              />
              {section === 'colors' ? (
                <MyColorPicker
                  onChange={color => {
                    onNewValue(ov => ({ ...ov, value: rgbaToString(color) }));
                  }}
                />
              ) : (
                <SimpleInput
                  placeholder="Theme value"
                  className={valueStyle}
                  onChange={v =>
                    onNewValue(ov => ({ ...ov, value: String(v) }))
                  }
                />
              )}
            </>
          )}
        </ConfirmAdder>
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
                <Button icon="trash" onClick={() => onChange(k, null)} />
              )}
            </div>
            {section === 'colors' ? (
              <MyColorPicker
                initColor={(v as string) || 'black'}
                onChange={color => {
                  onChange(k, rgbaToString(color));
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
        <DropMenu
          label={`Theme : ${editedThemeName}`}
          items={Object.keys(themesState.themes).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) => setEditedThemeName(value)}
          adder={
            <ConfirmStringAdder
              label="Add a new theme"
              validator={value => {
                if (!value || value === '') {
                  return 'The theme must have a name';
                } else if (Object.keys(themesState.themes).includes(value)) {
                  return 'The theme allready exists';
                }
              }}
              forceInputValue
              onAccept={value => {
                if (value != null) {
                  addNewTheme(value);
                  setEditedThemeName(value);
                }
              }}
            />
          }
          deleter={{
            filter: item => item.value !== 'default',
            onDelete: item => {
              deleteTheme(item.value);
              setEditedThemeName(() => {
                const newThemes = Object.keys(themesState.themes).filter(
                  k => k !== item.value,
                );
                if (newThemes.length === 0) {
                  return 'default';
                }
                return newThemes[0];
              });
            },
          }}
        />
        <DropMenu
          label={'Contexts'}
          items={Object.keys(themesState.selectedThemes).map(
            (k: keyof typeof themesState.selectedThemes) => ({
              value: k,
              label: (
                <>
                  <span style={{ minWidth: '100px' }}>{`${k}'s theme :`}</span>
                  <DropMenu
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
        <DropMenu
          label={'Sections'}
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
      <Toolbar.Content className={defaultMargin}>
        <ReflexContainer className={expandBoth} orientation="vertical">
          {selectedSection.colors && (
            <ReflexElement>
              <ThemeValueModifier
                theme={themesState.themes[editedThemeName]}
                section="colors"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'colors', k, v)
                }
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
                theme={themesState.themes[editedThemeName]}
                section="dimensions"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'dimensions', k, v)
                }
              />
            </ReflexElement>
          )}
          {selectedSection.dimensions && selectedSection.others && (
            <ReflexSplitter />
          )}
          {selectedSection.others && (
            <ReflexElement>
              <ThemeValueModifier
                theme={themesState.themes[editedThemeName]}
                section="others"
                onChange={(k, v) =>
                  setThemeValue(editedThemeName, 'others', k, v)
                }
              />
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}

interface ModeColorValueProps {
  label?: string;
  theme: Theme;
}

function ModeColorValue({ label, theme }: ModeColorValueProps) {
  return (
    <div className={cx(flex, itemCenter)}>
      {label}
      <div
        className={modeColorSelectorSample}
        style={{
          backgroundColor: label ? theme.values.colors[label] : undefined,
        }}
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
  const themeValuesWithUndefined = [
    'undefined',
    ...Object.keys(theme.values[section]),
  ];

  return (
    <div
      className={cx(flex, flexColumn)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content auto',
        alignItems: 'center',
      }}
    >
      <Title level="2" style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
        {section}
      </Title>
      {Object.entries(component[section as keyof typeof component] || []).map(
        ([k, v]: [string, ModeColor | ModeDimension | ModeOther]) => {
          const sectionValue = v == null ? 'undefined' : v;
          return (
            <React.Fragment key={k}>
              <div title={k}>{k} :</div>
              <DropMenu
                label={
                  section === 'colors' && v != null ? (
                    <ModeColorValue label={sectionValue} theme={theme} />
                  ) : (
                    sectionValue
                  )
                }
                items={themeValuesWithUndefined.map(k => ({
                  value: k,
                  label:
                    section === 'colors' && k !== 'undefined' ? (
                      <ModeColorValue label={k} theme={theme} />
                    ) : (
                      k
                    ),
                }))}
                onSelect={({ value: themeValue }) => onChange(k, themeValue)}
              />
            </React.Fragment>
          );
        },
      )}
    </div>
  );
}

function ModeEdition() {
  const {
    themesState,
    addNewMode,
    deleteMode,
    setModeValue,
  } = React.useContext(themeCTX);

  const { editedThemeName } = React.useContext(themeEditorCTX);

  const [editedMode, setEditedMode] = React.useState<string>('light');

  const [
    editedComponent,
    setEditedComponent,
  ] = React.useState<ModeComponentNames>('Common');
  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme['values']]?: boolean }
  >({ colors: true, dimensions: true, others: true });

  const currentModes = themesState.themes[editedThemeName].modes;
  const currentComponents = currentModes[editedMode].values;

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, flexDistribute, headerStyle)}>
        <DropMenu
          label={`Mode : ${editedMode}`}
          items={Object.keys(currentModes).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) => setEditedMode(value)}
          adder={
            <ConfirmStringAdder
              label="Add a new mode"
              validator={value => {
                if (!value || value === '') {
                  return 'The mode must have a name';
                } else if (Object.keys(currentModes).includes(value)) {
                  return 'The mode allready exists';
                }
              }}
              forceInputValue
              onAccept={value => {
                if (value != null) {
                  addNewMode(editedThemeName, value);
                  setEditedMode(value);
                }
              }}
            />
          }
          deleter={{
            filter: item => item.value !== 'dark' && item.value !== 'light',
            onDelete: item => {
              deleteMode(editedThemeName, item.value);
              setEditedMode(() => {
                const newModes = Object.keys(currentModes).filter(
                  k => k !== item.value,
                );
                if (newModes.length === 0) {
                  return 'light';
                }
                return newModes[0];
              });
            },
          }}
        />
        <DropMenu
          label={`Component : ${editedComponent}`}
          items={Object.keys(currentComponents).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) =>
            setEditedComponent(value as ModeComponentNames)
          }
        />
        <DropMenu
          label={'Sections'}
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
      <Toolbar.Content className={defaultMargin}>
        <ReflexContainer className={expandBoth} orientation="vertical">
          <ReflexElement>
            <ReflexContainer className={expandBoth} orientation="horizontal">
              {Object.entries(selectedSection)
                .filter(([v]) => v)
                .reduce<JSX.Element[]>((old, [section], i, a) => {
                  const component = currentComponents[editedComponent];
                  const entries = Object.keys(
                    component[section as keyof typeof component] || {},
                  );

                  const content = (
                    <ReflexElement key={section} flex={entries.length + 1}>
                      <ModeValueModifier
                        theme={themesState.themes[editedThemeName]}
                        component={component}
                        section={section as keyof ThemeValues}
                        onChange={(k, v) =>
                          setModeValue(
                            editedThemeName,
                            editedMode,
                            editedComponent,
                            section as keyof ThemeValues,
                            k,
                            v,
                          )
                        }
                      />
                    </ReflexElement>
                  );

                  const splitter = <ReflexSplitter />;

                  if (i < a.length - 1) {
                    return [...old, content, splitter];
                  } else {
                    return [...old, content];
                  }
                }, [])}
            </ReflexContainer>
            {/* <ModeValueModifier
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
            /> */}
          </ReflexElement>
          <ReflexSplitter />
          <ReflexElement>
            {/* <PageExamples modeName={editedMode} /> */}
          </ReflexElement>
        </ReflexContainer>
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
        initialLayout={['Themes', 'Modes']}
        layoutId={THEME_EDITOR_LAYOUT_ID}
      />
    </themeEditorCTX.Provider>
  );
}
