import * as React from 'react';
import { MainLinearLayout } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { ThemeEdition } from './Theme/ThemeEdition';
import { ModeEdition } from './Mode/ModeEdition';
import Preview from './Preview';
import { Toolbar } from '../../Toolbar';
import { css, cx } from 'emotion';
import {
  defaultPaddingBottom,
  defaultPaddingLeft,
  flex,
} from '../../../css/classes';
import {
  setSelectedTheme,
  getThemeDispatch,
  useThemeStore,
} from '../../../data/Stores/themeStore';
import { DropMenu } from '../../DropMenu';
import { ThemeSelector } from './Theme/ThemeSelector';
import { ModeSelector } from './Mode/ModeSelector';
import { themeVar } from '../ThemeVars';
import { outlineButtonStyle } from '../../Inputs/Buttons/Button';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

const themeEditorHeaderStyle = css({
  backgroundColor: themeVar.colors.ActiveColor,
  button: {
    fontSize: '13px',
  },
  ['button:not(.iconOnly)']: {
    ...outlineButtonStyle,
    marginLeft: '15px',
  },
  ['button.noOutline, .confirmBtn button:not(.dark)']: {
    backgroundColor: themeVar.colors.PrimaryColor,
    border: 'none',
    marginLeft: '5px',
  },
  ['button.iconOnly']: {
    color: themeVar.colors.HeaderColor,
    ['&:hover']: {
      color: themeVar.colors.PrimaryColor + '!important',
    },
  },
});

export default function ThemeEditor() {
  const { themes, selectedThemes } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();
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
        <ThemeSelector />
        <ModeSelector />
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
      </Toolbar.Header>
      <Toolbar.Content>
        <MainLinearLayout
          tabs={{
            Theme: <ThemeEdition />,
            Modes: <ModeEdition />,
            Preview: <Preview />,
          }}
          initialLayout={[['Theme'], ['Preview']]}
          layoutId={THEME_EDITOR_LAYOUT_ID}
          areChildren
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
