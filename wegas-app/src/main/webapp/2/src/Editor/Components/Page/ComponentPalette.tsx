import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexWrap, button } from '../../../css/classes';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { themeVar } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { useDrag } from 'react-dnd';

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
}

interface ComponentElementProps {
  componentName: string;
}

export const dndComponnent: 'dndComponnent' = 'dndComponnent';

function ComponentElement({ componentName }: ComponentElementProps) {
  const [, drag] = useDrag<DnDComponent, unknown, unknown>({
    item: {
      componentName: componentName,
      type: dndComponnent,
    },
  });
  const component = usePageComponentStore(s => s[componentName]);
  return (
    <div ref={drag} className={componentStyle}>
      {component ? (
        <IconButton
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
