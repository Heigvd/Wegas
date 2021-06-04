import { cx } from 'emotion';
import * as React from 'react';
import { flex, flexRow, grow } from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  addNewMode,
  setBaseMode,
  setEditedMode,
  deleteMode,
} from '../../../../data/Stores/themeStore';
import { Button } from '../../../Inputs/Buttons/Button';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { themeVar } from '../../ThemeVars';
import { AdderSelector } from '../AdderSelector';

export function ModeSelector() {
  const { themes, editedThemeName, editedModeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const currentTheme = themes[editedThemeName];
  const currentModes = currentTheme?.modes || {};

  const onError = React.useCallback(
    (value: string | undefined) => {
      if (value != null && Object.keys(currentModes).includes(value)) {
        return 'The mode allready exists';
      }
    },
    [currentModes],
  );

  return (
    <AdderSelector
      items={Object.keys(currentModes).map(k => ({
        value: k,
        label: (
          <div className={cx(flex, flexRow, grow)}>
            <div className={grow}>{k}</div>
            {k !== currentTheme.baseMode && (
              <ConfirmButton
                icon={{
                  icon: 'trash',
                }}
                onAction={sucess => {
                  if (sucess) {
                    dispatch(deleteMode(k));
                  }
                }}
              />
            )}
            <Button
              icon={{
                icon: 'star',
                color:
                  currentTheme.baseMode === k
                    ? themeVar.colors.SuccessColor
                    : undefined,
              }}
              onClick={e => {
                e.stopPropagation();
                dispatch(setBaseMode(k));
              }}
            />
          </div>
        ),
      }))}
      selectedItem={editedModeName}
      menuLabel={`Mode : ${editedModeName}`}
      placeholder="Mode name"
      onSelect={value => {
        dispatch(setEditedMode(value));
      }}
      onAccept={value => dispatch(addNewMode(value))}
      onError={onError}
    />
  );
}
