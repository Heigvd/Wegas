import { cx } from 'emotion';
import * as React from 'react';
import { ReflexElement, ReflexSplitter, ReflexContainer } from 'react-reflex';
import {
  flex,
  flexDistribute,
  headerStyle,
  contentStyle,
} from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  setModeValue,
  setBaseMode,
  setEditedMode,
  addNewMode,
  deleteMode,
  setNextMode,
} from '../../../../data/Stores/themeStore';
import { DropMenu } from '../../../DropMenu';
import { Button } from '../../../Inputs/Buttons/Button';
import { ConfirmStringAdder } from '../../../Inputs/String/ConfirmStringAdder';
import { Toolbar } from '../../../Toolbar';
import {
  ModeComponentNames,
  ThemeValues,
  ModeValues,
  themeVar,
  Theme,
} from '../../ThemeVars';
import { ModeValueModifier } from './ModeValueModifier';

export function ModeEdition() {
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
