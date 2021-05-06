import * as React from 'react';
import { themeVar } from '../ThemeVars';
import { MainLinearLayout } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { ThemeEdition } from './Theme/ThemeEdition';
import { ModeEdition } from './Mode/ModeEdition';

const THEME_EDITOR_LAYOUT_ID = 'ThemeEditorLayout';

export const borderStyle = {
  borderStyle: 'solid',
  borderColor: themeVar.Common.colors.HeaderColor,
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
};

export default function ThemeEditor() {
  return (
    <MainLinearLayout
      tabs={{
        Themes: <ThemeEdition />,
        Modes: <ModeEdition />,
      }}
      initialLayout={['Themes', 'Modes']}
      layoutId={THEME_EDITOR_LAYOUT_ID}
    />
  );
}
