import * as React from 'react';
import { MainLinearLayout } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { ThemeEdition } from './Theme/ThemeEdition';
import { ModeEdition } from './Mode/ModeEdition';
import Preview from './Preview';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

export default function ThemeEditor() {
  return (
    <MainLinearLayout
      tabs={{
        Themes: <ThemeEdition />,
        Modes: <ModeEdition />,
        Preview: <Preview />,
      }}
      initialLayout={[['Themes'], ['Preview']]}
      layoutId={THEME_EDITOR_LAYOUT_ID}
    />
  );
}
