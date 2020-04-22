import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { css } from 'emotion';
import { themeVar } from '../Theme';

// export const dropZoneFocusCss = {
//   background:
//     'repeating-Linear-gradient( 45deg, #fff, #fff 10px, #eee 10px, #eee 20px);',
//   zIndex: 1000,
// };
const dropZoneForeground = {
  zIndex: 1000,
};

export const dropZoneFocusCss = {
  background: `
  repeating-Linear-gradient( 45deg, transparent 10px, ${themeVar.primaryHoverColor} 10px, transparent 20px);
  repeating-Linear-gradient( -45deg, transparent 10px, ${themeVar.primaryHoverColor} 10px, transparent 20px);
  `,
  ...dropZoneForeground,
};

const dropZoneHoverCss = {
  background: `
  repeating-Linear-gradient( 45deg, transparent 10px, ${themeVar.successColor} 10px, transparent 20px);
  repeating-Linear-gradient( -45deg, transparent 10px, ${themeVar.successColor} 10px, transparent 20px);
  `,
  ...dropZoneForeground,
};

export const dropZoneFocusAndHoverClass = css({
  ...dropZoneFocusCss,
  ':hover': dropZoneHoverCss,
});

export const dropZoneFocus = css(dropZoneFocusCss);

const dropZoneHover = css(dropZoneHoverCss);

export const dropZoneClass = (over?: boolean) =>
  over ? dropZoneHover : dropZoneFocus;

export function DefaultDndProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
