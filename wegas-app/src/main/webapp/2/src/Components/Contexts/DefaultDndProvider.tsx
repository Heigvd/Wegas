import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { css, cx } from 'emotion';
import { themeVar } from '../Theme';

export const dropZoneFocus = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
});

export const dropZoneHover = cx(
  dropZoneFocus,
  css({
    backgroundColor: themeVar.successColor,
  }),
);

export const dropZoneClass = (over?: boolean) =>
  over ? dropZoneHover : dropZoneFocus;

export function DefaultDndProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
