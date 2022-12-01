import { cx } from '@emotion/css';
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
import { classNameOrEmpty } from '../../../../Helper/className';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { Button } from '../../../Inputs/Buttons/Button';
import { themeVar } from '../../ThemeVars';
import { AdderSelector } from '../AdderSelector';

interface ModeSelectorProps {
  dropMenuClassName?: string;
  addButtonClassName?: string;
}

export function ModeSelector({
  dropMenuClassName,
  addButtonClassName,
}: ModeSelectorProps) {
  const { themes, editedThemeName, editedModeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  const currentTheme = themes[editedThemeName];
  const currentModes = currentTheme?.modes || {};

  const i18nValues = useInternalTranslate(editorTabsTranslations);

  const onError = React.useCallback(
    (value: string | undefined) => {
      if (value != null && Object.keys(currentModes).includes(value)) {
        return i18nValues.themeEditor.modeAlreadyExists;
      }
    },
    [currentModes, i18nValues.themeEditor.modeAlreadyExists],
  );

  return (
    <AdderSelector
      items={Object.keys(currentModes).map(k => ({
        value: k,
        label: (
          <div className={cx(flex, flexRow, grow)}>
            <div className={grow}>{k}</div>
            {k !== currentTheme.baseMode && k !== 'light' && k !== 'dark' && (
              <Button
                icon={{
                  icon: 'trash',
                }}
                tooltip={i18nValues.themeEditor.deleteMode}
                onClick={sucess => {
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
              tooltip={i18nValues.themeEditor.setMainMode}
              onClick={e => {
                e.stopPropagation();
                dispatch(setBaseMode(k));
              }}
            />
          </div>
        ),
      }))}
      selectedItem={editedModeName}
      menuLabel={i18nValues.themeEditor.mode(editedModeName)}
      placeholder={i18nValues.themeEditor.modeName}
      tooltip={i18nValues.themeEditor.addMode}
      onSelect={value => {
        dispatch(setEditedMode(value));
      }}
      onAccept={value => dispatch(addNewMode(value))}
      onError={onError}
      dropMenuClassName={classNameOrEmpty(dropMenuClassName)}
      addButtonClassName={classNameOrEmpty(addButtonClassName)}
    />
  );
}
