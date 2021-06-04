import * as React from 'react';
import { MainLinearLayout } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { ThemeEdition } from './Theme/ThemeEdition';
import { ModeEdition } from './Mode/ModeEdition';
import Preview from './Preview';
import { Toolbar } from '../../Toolbar';
import { css, cx } from 'emotion';
import {
  flex,
  flexColumn,
  flexDistribute,
  itemCenter,
} from '../../../css/classes';
import {
  setSelectedTheme,
  getThemeDispatch,
  useThemeStore,
} from '../../../data/Stores/themeStore';
import { DropMenu } from '../../DropMenu';
import { themeVar } from '../ThemeVars';
import { ThemeSelector } from './Theme/ThemeSelector';
import { ModeSelector } from './Mode/ModeSelector';

const headerStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
});

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

export default function ThemeEditor() {
  const { themes, selectedThemes } = useThemeStore(s => s);
  const dispatch = getThemeDispatch();

  return (
    <Toolbar>
      <Toolbar.Header
        className={cx(flex, flexDistribute, itemCenter, headerStyle)}
      >
        <div className={cx(flex, flexColumn)}>{}</div>
        <ThemeSelector />
        <ModeSelector />
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
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
