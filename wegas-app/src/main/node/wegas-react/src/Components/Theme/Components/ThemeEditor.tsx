import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  defaultPaddingBottom,
  defaultPaddingLeft,
  flex,
} from '../../../css/classes';
import { MainLinearLayout } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { DropMenu } from '../../DropMenu';
import { outlineButtonStyle } from '../../Inputs/Buttons/Button';
import { tabLayoutChildrenClassNames } from '../../TabLayout/tabLayoutStyles';
import { Toolbar } from '../../Toolbar';
import { themeVar } from '../ThemeVars';
import { ModeEdition } from './Mode/ModeEdition';
import { ModeSelector } from './Mode/ModeSelector';
import Preview from './Preview';
import { ThemeEdition } from './Theme/ThemeEdition';
import { ThemeSelector } from './Theme/ThemeSelector';
import { customStateEquals, useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedTheme } from '../../../store/slices/theme';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';
const addIconStyle = css({
  color: themeVar.colors.LightTextColor,
  marginRight: '10px',
  '&:hover': {
    color: themeVar.colors.PrimaryColor,
  },
});

const themeEditorHeaderStyle = css({
  backgroundColor: themeVar.colors.ActiveColor,
  button: {
    fontSize: '13px',
  },
});

const themeEditorTabs = [
  { tabId: 'Theme', content: <ThemeEdition /> },
  { tabId: 'Modes', content: <ModeEdition /> },
  { tabId: 'Preview', content: <Preview /> },
];

const themeEditorDefaultLayout = [['Theme'], ['Preview']];


export default function ThemeEditor() {
  const dispatch = useAppDispatch();
  const { themesKeys, selectedThemes } = useAppSelector(
    s => ({
      themesKeys: Object.keys(s.themes.themes),
      selectedThemes: s.themes.selectedThemes,
    }),
    customStateEquals,
  );
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  return (
    <Toolbar>
      <Toolbar.Header
        className={cx(
          flex,
          defaultPaddingBottom,
          defaultPaddingLeft,
          themeEditorHeaderStyle,
        )}
      >
        <ThemeSelector
          dropMenuClassName={css({ ...outlineButtonStyle })}
          addButtonClassName={addIconStyle}
        />
        <ModeSelector
          dropMenuClassName={css({ ...outlineButtonStyle })}
          addButtonClassName={addIconStyle}
        />
        <DropMenu
          label={i18nValues.themeEditor.contexts}
          items={Object.keys(selectedThemes).map(
            (k: keyof typeof selectedThemes) => ({
              value: k,
              label: (
                <>
                  <span style={{ minWidth: '100px' }}>
                    {i18nValues.themeEditor.themeNameVal(k)}
                  </span>
                  <DropMenu
                    buttonClassName="noOutline"
                    label={selectedThemes[k]}
                    items={themesKeys.map(k => ({
                      value: k,
                      label: k,
                    }))}
                    onSelect={({ value }) => {
                      dispatch(setSelectedTheme({themeName: value, contextName: k}));
                    }}
                  />
                </>
              ),
            }),
          )}
          onSelect={() => {}}
          buttonClassName={css({ ...outlineButtonStyle })}
        />
      </Toolbar.Header>
      <Toolbar.Content>
        <MainLinearLayout
          tabs={themeEditorTabs}
          initialLayout={themeEditorDefaultLayout}
          layoutId={THEME_EDITOR_LAYOUT_ID}
          classNames={tabLayoutChildrenClassNames}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
