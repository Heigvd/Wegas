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
import { wlog } from '../../../../Helper/wegaslog';
import { commonTranslations } from '../../../../i18n/common/common';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { AdderSelector } from '../AdderSelector';

export function ThemeSelector() {
  const { themes, editedThemeName } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();
  const i18nValues = useInternalTranslate(commonTranslations);
  const i18nValuesEditor = useInternalTranslate(editorTabsTranslations);

  const onError = React.useCallback(
    (value: string | undefined) => {
      if (value != null && Object.keys(themes).includes(value)) {
        return i18nValuesEditor.themeEditor.themeAlreadyExists;
      }
    },
    [i18nValuesEditor.themeEditor.themeAlreadyExists, themes],
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
                tooltip={i18nValues.reset}
                onAction={success => success && dispatch(resetTheme(k))}
                modalDisplay
                modalMessage={i18nValues.reset + "?"}
              />
            ) : (
              <ConfirmButton
                icon="trash"
                tooltip={i18nValuesEditor.themeEditor.deleteTheme}
                onAction={success => {wlog(success); success && dispatch(deleteTheme(k))}}
                modalDisplay
                modalMessage={i18nValuesEditor.themeEditor.deleteTheme + "?"}
              />
            )}
          </div>
        ),
      }))}
      selectedItem={editedThemeName}
      menuLabel={i18nValuesEditor.themeEditor.theme(editedThemeName)}
      placeholder={i18nValuesEditor.themeEditor.themeName}
      tooltip={i18nValuesEditor.themeEditor.addTheme}
      onSelect={value => {
        dispatch(setEditedTheme(value));
      }}
      onAccept={value => dispatch(addNewLib(value))}
      onError={onError}
    />
  );
}
