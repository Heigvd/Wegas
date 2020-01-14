import * as React from 'react';
import { Toolbar } from './Toolbar';
import {
  ThemeColorModifiers,
  Theme,
  themeCTX,
  ThemeColors,
  ThemeEntries,
  themeVar,
} from './Theme';
import { cx, css } from 'emotion';
import { flex, grow, flexColumn } from '../css/classes';
import { ChromePicker } from 'react-color';
import { OnChangeHandler } from 'react-color/lib/components/common/ColorWrap';
import * as Color from 'color';
import { useOnClickOutside } from './Hooks/useOnClickOutside';
import { IconButton } from './Inputs/Button/IconButton';
import { Menu } from './Menu';
import { TextPrompt } from '../Editor/Components/TextPrompt';
import { ConfirmButton } from './Inputs/Button/ConfirmButton';
import { NumberSlider } from './NumberSlider';
import { wlog } from '../Helper/wegaslog';
import { MessageString } from '../Editor/Components/MessageString';

const colorButton = (color: string, bgColor?: string) =>
  css({
    backgroundColor: color,
    width: '200px',
    height: '50px',
    borderStyle: 'solid',
    borderColor:
      Color(bgColor).lightness() === 0
        ? '#4C4C4C'
        : (Color(bgColor).isLight()
            ? Color(bgColor).darken(0.5)
            : Color(bgColor).lighten(0.5)
          ).toString(),
    borderWidth: '5px',
    borderRadius: themeVar.borderRadius,
    cursor: 'pointer',
  });

const themeAttrForm = css({
  padding: '10px',
});

interface MyColorPickerProps {
  color: string;
  bgColor?: string;
  onChange?: OnChangeHandler;
}

function MyColorPicker({ color, bgColor, onChange }: MyColorPickerProps) {
  const [displayed, setDisplayed] = React.useState(false);
  const pickerZone = React.useRef(null);
  useOnClickOutside(pickerZone, () => {
    setDisplayed(false);
  });

  wlog(Color(bgColor).lightness());

  return (
    <div className={flex} ref={pickerZone}>
      <div
        className={cx(
          colorButton(
            color,
            Color(bgColor).lightness() < 20
              ? Color(bgColor)
                  .lighten(50)
                  .toString()
              : bgColor,
          ),
          grow,
        )}
        onClick={() => setDisplayed(old => !old)}
      />
      {displayed && (
        <ChromePicker
          className={grow}
          color={color}
          onChangeComplete={onChange}
        />
      )}
    </div>
  );
}

interface ThemeEditorModal {
  type: 'close' | 'newTheme';
}

interface ThemeEditorErrorModal {
  type: 'error';
  label?: string;
}

type ThemeEditorState = ThemeEditorModal | ThemeEditorErrorModal;

export default function ThemeEditor() {
  const [modalState, setModalState] = React.useState<ThemeEditorState>({
    type: 'close',
  });
  const {
    themeState,
    addNewTheme,
    deleteTheme,
    setSelectedTheme,
    setThemeEntry,
    setThemeColor,
    setThemeModifer,
  } = React.useContext(themeCTX);
  const [currentModifiedTheme, setModifiedTheme] = React.useState<string>(
    themeState.selectedTheme['editor'],
  );
  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme]?: boolean }
  >(
    Object.keys(themeState.themes[currentModifiedTheme]).reduce(
      (o, k: keyof Theme) => ({ ...o, [k]: true }),
      {},
    ),
  );

  const currentEntries = themeState.themes[currentModifiedTheme].entries;
  const currentValues = themeState.themes[currentModifiedTheme].colors;
  const currentModifiers = themeState.themes[currentModifiedTheme].modifiers;

  return (
    <Toolbar>
      <Toolbar.Header className={flex}>
        <div className={grow}>
          <div>
            {modalState.type === 'newTheme' ? (
              <TextPrompt
                placeholder="Theme name"
                defaultFocus
                onAction={(success, value) => {
                  if (value === '') {
                    setModalState({
                      type: 'error',
                      label: 'The theme must have a name',
                    });
                  } else {
                    if (success) {
                      addNewTheme(value);
                      setModifiedTheme(value);
                      setModalState({ type: 'close' });
                    }
                  }
                }}
                onBlur={() => setModalState({ type: 'close' })}
                applyOnEnter
              />
            ) : (
              <IconButton
                icon="plus"
                tooltip="Add a new theme"
                onClick={() => setModalState({ type: 'newTheme' })}
              />
            )}
            <Menu
              label={currentModifiedTheme}
              items={Object.keys(themeState.themes).map(k => ({
                id: k,
                label: k,
              }))}
              onSelect={({ id }) => setModifiedTheme(id)}
            />
            <ConfirmButton
              icon="trash"
              tooltip="Delete the theme"
              onAction={success => {
                if (success) {
                  deleteTheme(currentModifiedTheme);
                  setModifiedTheme(old => {
                    const newThemes = Object.keys(themeState.themes).filter(
                      k => k !== old,
                    );
                    if (newThemes.length === 0) {
                      return 'default';
                    }
                    return newThemes[0];
                  });
                }
              }}
              onBlur={() => setModalState({ type: 'close' })}
            />
            {modalState.type === 'error' && (
              <MessageString
                type="error"
                value={modalState.label}
                onLabelVanish={() => setModalState({ type: 'close' })}
              />
            )}
          </div>
          <div>
            <Menu
              label={'Contexts'}
              items={Object.keys(themeState.selectedTheme).map(
                (k: keyof typeof themeState.selectedTheme) => ({
                  id: k,
                  label: (
                    <>
                      <span
                        style={{ minWidth: '100px' }}
                      >{`${k}'s theme :`}</span>
                      <Menu
                        label={themeState.selectedTheme[k]}
                        items={Object.keys(themeState.themes).map(k => ({
                          id: k,
                          label: k,
                        }))}
                        onSelect={({ id }) => setSelectedTheme(id, k)}
                      />
                    </>
                  ),
                }),
              )}
              onSelect={() => {}}
            />
          </div>
        </div>
        <Menu
          label={'Theme editor content'}
          items={Object.keys(themeState.themes[currentModifiedTheme]).map(
            (k: keyof Theme) => ({
              id: k,
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
          onSelect={({ id: k }) =>
            setSelectedSection(o => ({ ...o, [k]: !o[k] }))
          }
        />
      </Toolbar.Header>
      <Toolbar.Content>
        {selectedSection.colors && (
          <div className={cx(flex, grow, flexColumn, themeAttrForm)}>
            {Object.keys(currentValues).map((k: keyof ThemeColors) => (
              <p key={k}>
                <label
                  className={cx(
                    // titleStyle,
                    css({ display: 'flex', alignItems: 'center' }),
                  )}
                  htmlFor={k}
                  title={k}
                >
                  {k} :
                </label>
                <MyColorPicker
                  color={currentValues[k]}
                  bgColor={
                    themeState.themes[themeState.selectedTheme.editor].colors
                      .backgroundColor
                  }
                  onChange={color => {
                    setThemeColor(currentModifiedTheme, k, color.hex);
                  }}
                />
              </p>
            ))}
          </div>
        )}
        {selectedSection.modifiers && (
          <div className={cx(flex, grow, flexColumn, themeAttrForm)}>
            {Object.keys(currentModifiers).map(
              (k: keyof ThemeColorModifiers) => (
                <p key={k}>
                  <label
                    className={cx(
                      css({ display: 'flex', alignItems: 'center' }),
                    )}
                    htmlFor={k}
                    title={k}
                  >
                    {k} :
                  </label>
                  <NumberSlider
                    max={1}
                    min={0}
                    value={currentModifiers[k]}
                    onChange={v => setThemeModifer(currentModifiedTheme, k, v)}
                  />
                </p>
              ),
            )}
          </div>
        )}
        {selectedSection.entries && (
          <div className={cx(flex, grow, flexColumn, themeAttrForm)}>
            {Object.keys(currentEntries).map((k: keyof ThemeEntries) => (
              <p key={k}>
                <label
                  className={cx(css({ display: 'flex', alignItems: 'center' }))}
                  htmlFor={k}
                  title={k}
                >
                  {k} :
                </label>
                <NumberSlider
                  max={15}
                  min={0}
                  steps={15}
                  value={Number(currentEntries[k].replace('px', ''))}
                  onChange={v =>
                    setThemeEntry(currentModifiedTheme, k, v + 'px')
                  }
                  displayValues={val => val + 'px'}
                />
              </p>
            ))}
          </div>
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
