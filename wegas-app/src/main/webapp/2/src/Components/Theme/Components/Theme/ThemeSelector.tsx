import { cx } from 'emotion';
import * as React from 'react';
import { flex, flexRow, grow } from '../../../../css/classes';
import {
  useThemeStore,
  getThemeDispatch,
  resetTheme,
  deleteTheme,
  setEditedTheme,
  addNewLib,
} from '../../../../data/Stores/themeStore';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { AdderSelector } from '../AdderSelector';

export function ThemeSelector() {
  const { themes, editedThemeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const onError = React.useCallback(
    (value: string | undefined) => {
      if (value != null && Object.keys(themes).includes(value)) {
        return 'The theme allready exists';
      }
    },
    [themes],
  );

  return (
    <AdderSelector
      items={Object.keys(themes).map(k => ({
        value: k,
        label: (
          <div className={cx(flex, flexRow, grow)}>
            <div className={grow}>{k}</div>
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
          </div>
        ),
      }))}
      selectedItem={editedThemeName}
      menuLabel={`Theme : ${editedThemeName}`}
      placeholder="Theme name"
      onSelect={value => {
        dispatch(setEditedTheme(value));
      }}
      onAccept={value => dispatch(addNewLib(value))}
      onError={onError}
    />
  );
}
