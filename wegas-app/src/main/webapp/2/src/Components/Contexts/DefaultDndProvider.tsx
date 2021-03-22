import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {
  hatchedBackground,
  highlightedHatchedBackground,
} from '../../css/classes';

export const dropZoneFocus = hatchedBackground;
export const dropZoneHover = highlightedHatchedBackground;

export const dropZoneClass = (over?: boolean) =>
  over ? dropZoneHover : dropZoneFocus;

export function DefaultDndProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
