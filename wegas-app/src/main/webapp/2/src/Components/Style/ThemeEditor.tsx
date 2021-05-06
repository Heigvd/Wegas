import * as React from 'react';
import { Toolbar } from '../Toolbar';
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
  justifyCenter,
  componentMarginLeft,
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
  Theme,
  defaultThemeValues,
  ThemeValues,
  ModeValues,
} from './ThemeVars';
import { MainLinearLayout } from '../../Editor/Components/LinearTabLayout/LinearLayout';
import { SimpleInput } from '../Inputs/SimpleInput';
import { ConfirmStringAdder } from '../Inputs/String/ConfirmStringAdder';
import { Title } from '../Inputs/String/Title';
import { ConfirmAdder } from '../Inputs/String/ConfirmAdder';
import { Button } from '../Inputs/Buttons/Button';
import * as Color from 'color';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  addNewMode,
  addNewLib,
  deleteMode,
  deleteTheme,
  getThemeDispatch,
  resetTheme,
  setBaseMode,
  setEditedMode,
  setEditedTheme,
  setModeValue,
  setNextMode,
  setThemeValue,
  useThemeStore,
  setSelectedTheme,
} from '../../data/Stores/themeStore';
import { ConfirmButton } from '../Inputs/Buttons/ConfirmButton';

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

interface ThemeValueModifierProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K]
> {
  theme: Theme | undefined;
  section: T;
  onChange: (entry: K, value: V | null) => void;
}

function ThemeValueModifier<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K]
>({ theme, section, onChange }: ThemeValueModifierProps<T, K, V>) {
  const accept: (value?: {
    name?: string;
    value: string;
  }) => string | undefined = value =>
    value?.name == null || value.name === ''
      ? 'You have to enter a name'
      : Object.keys(theme?.values[section] || {}).includes(value?.name || '')
      ? `The ${section} value already exists`
      : undefined;

  const validator: (
    value?:
      | {
          name?: string;
          value: string;
        }
      | undefined,
  ) => string | undefined = value => {
    if (Object.keys(theme?.values[section] || {}).includes(value?.name || '')) {
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
          onAccept={value => onChange(value!.name! as K, value!.value as V)}
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
        {Object.entries(theme?.values[section] || {}).map(([k, v]) => (
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
                <ConfirmButton
                  icon="trash"
                  onAction={success => success && onChange(k as K, null)}
                />
              )}
            </div>
            {section === 'colors' ? (
              <MyColorPicker
                initColor={(v as string) || 'black'}
                onChange={color => {
                  onChange(k as K, rgbaToString(color) as V);
                }}
              />
            ) : (
              <SimpleInput
                className={valueStyle}
                value={v}
                onChange={v => onChange(k as K, String(v) as V)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeEdition() {
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
  theme: Theme | undefined;
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
  if (theme == null) {
    return null;
  }

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
  const { themes, editedThemeName, editedModeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const [
    editedComponent,
    setEditedComponent,
  ] = React.useState<ModeComponentNames>('Common');
  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof ThemeValues]?: boolean }
  >({ colors: true, dimensions: true, others: true });

  const currentTheme = themes[editedThemeName];
  const editedValues = currentTheme?.values || {};
  const currentModes = currentTheme?.modes || {};
  const currentMode = currentModes[editedModeName];
  const currentComponents = currentMode?.values || {};

  const modeValueReducer = React.useCallback(
    (
      old: JSX.Element[],
      [section]: [keyof ValueOf<ModeValues>, boolean],
      i: number,
      a: [keyof ValueOf<ModeValues>, boolean][],
    ) => {
      const component = currentComponents[editedComponent] || {};
      // const entries = Object.keys(component[section] || {});

      const content = (
        <ReflexElement key={section} /*flex={entries.length + 1}*/>
          <ModeValueModifier
            theme={currentTheme}
            component={component}
            section={section}
            onChange={(k, v) =>
              dispatch(
                // Type are becomming too complex here. We just have to rely on dev to send good values
                setModeValue(editedComponent, section, k as never, v as never),
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
    [currentComponents, currentTheme, dispatch, editedComponent],
  );

  return (
    <Toolbar>
      <Toolbar.Header className={cx(flex, flexDistribute, headerStyle)}>
        <DropMenu
          label={`Mode : ${editedModeName}`}
          selected={editedModeName}
          items={Object.keys(currentModes).map(k => ({
            value: k,
            label: (
              <>
                {k}
                <Button
                  icon={{
                    icon: 'star',
                    color:
                      currentTheme.baseMode === k
                        ? themeVar.Common.colors.SuccessColor
                        : undefined,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    dispatch(setBaseMode(k));
                  }}
                />
              </>
            ),
          }))}
          onSelect={({ value }) => dispatch(setEditedMode(value))}
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
                  dispatch(addNewMode(value));
                }
              }}
            />
          }
          deleter={{
            filter: item => item.value !== currentTheme.baseMode,
            onDelete: item => {
              dispatch(deleteMode(item.value));
            },
          }}
        />
        <DropMenu
          label={`Next mode : ${currentMode?.nextModeName}`}
          items={Object.keys(currentModes).map(k => ({
            value: k,
            label: k,
          }))}
          onSelect={({ value }) => dispatch(setNextMode(value))}
        />
        <DropMenu
          label={`Component : ${editedComponent}`}
          selected={editedComponent as string}
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
        <ReflexContainer orientation="vertical">
          {Object.entries(selectedSection)
            .filter(([, v]) => v)
            .reduce<JSX.Element[]>(modeValueReducer, [])}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ThemeEditor() {
  return (
    <MainLinearLayout
      tabs={{
        Themes: <ThemeEdition />,
        Modes: <ModeEdition />,
      }}
      initialLayout={['Themes', 'Modes']}
      layoutId={THEME_EDITOR_LAYOUT_ID}
    />
  );
}
