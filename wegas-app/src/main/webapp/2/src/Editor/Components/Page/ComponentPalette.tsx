import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexWrap, button } from '../../../css/classes';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { themeVar } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import {
  useDrag,
  DragElementWrapper,
  DragSourceOptions,
  DragPreviewOptions,
} from 'react-dnd';

const componentStyle = css({
  padding: '10px',
  height: 'fit-content',
  width: 'fit-content',
  backgroundColor: themeVar.primaryLighterColor,
  margin: '5px',
  display: 'inline-block',
  cursor: 'pointer',
});

const paletteStyle = css({
  width: '125px',
  height: 'fit-content',
});

export interface DnDComponent {
  componentName: string;
  type: typeof dndComponnent;
  path?: number[];
}

interface ComponentElementProps {
  componentName: string;
}

export const dndComponnent: 'dndComponnent' = 'dndComponnent';

export interface DragMonitor {
  handlerId: string | symbol | null;
  isDragging: boolean;
}

export function useComponentDrag(
  componentName: string,
  path?: number[],
): [
  DragMonitor,
  DragElementWrapper<DragSourceOptions>,
  DragElementWrapper<DragPreviewOptions>,
] {
  return useDrag({
    item: {
      componentName,
      type: dndComponnent,
      path,
    },
    collect: monitor => ({
      handlerId: monitor.getHandlerId(),
      isDragging: !!monitor.isDragging(),
    }),
  });
}

function ComponentElement({ componentName }: ComponentElementProps) {
  const component = usePageComponentStore(s => s[componentName]);
  const [, drag, preview] = useComponentDrag(componentName);

  return (
    <div ref={drag} className={componentStyle}>
      {component ? (
        <IconButton
          ref={preview}
          icon={component.getIcon()}
          className={cx(button, css({ width: '25px', height: '25px' }))}
          tooltip={componentName}
          label={componentName}
        />
      ) : (
        <span>{`Unknown component "${componentName}"`}</span>
      )}
    </div>
  );
}

export function ComponentPalette() {
  const components = usePageComponentStore(s => s);
  return (
    <div className={cx(flex, flexWrap, paletteStyle)}>
      {Object.keys(components).map(k => (
        <ComponentElement key={k} componentName={k} />
      ))}
    </div>
  );
}
