import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexWrap, button } from '../../../css/classes';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import {
  useDrag,
  DragElementWrapper,
  DragSourceOptions,
  DragPreviewOptions,
} from 'react-dnd';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { themeVar } from '../../../Components/Style/ThemeVars';

const componentStyle = css({
  padding: '10px',
  height: 'fit-content',
  width: 'fit-content',
  backgroundColor: themeVar.ComponentPalette.colors.ComponentColor,
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
  type: typeof PAGEEDITOR_COMPONENT_TYPE;
  path?: number[];
}

export function isDnDComponent(
  item?: Partial<DnDComponent>,
): item is DnDComponent {
  return (
    typeof item === 'object' &&
    item != null &&
    'componentName' in item &&
    typeof item.componentName === 'string' &&
    'type' in item &&
    typeof item.type === 'string'
  );
}

interface ComponentElementProps {
  componentName: string;
}

export const PAGEEDITOR_COMPONENT_TYPE = 'dndComponnent';

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
      type: PAGEEDITOR_COMPONENT_TYPE,
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
          icon={component.icon}
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
  const componentNames = usePageComponentStore(
    s => Object.keys(s),
    deepDifferent,
  );
  return (
    <div className={cx(flex, flexWrap, paletteStyle)}>
      {componentNames.map(k => (
        <ComponentElement key={k} componentName={k} />
      ))}
    </div>
  );
}
