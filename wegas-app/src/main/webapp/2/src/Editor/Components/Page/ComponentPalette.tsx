import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexWrap, button } from '../../../css/classes';
import { usePageComponentStore } from '../../../Components/PageComponents/componentFactory';
import { themeVar } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Button/IconButton';
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

interface ComponentElementProps {
  componentName: string;
  onDrag?: (componentName: string) => void;
}

export const dndComponnent: 'dndComponnent' = 'dndComponnent';

function ComponentElement({ componentName, onDrag }: ComponentElementProps) {
  const [, drag] = useDrag<
    { componentName: string; type: typeof dndComponnent },
    unknown,
    unknown
  >({
    item: {
      componentName: componentName,
      type: dndComponnent,
    },
    begin: () => onDrag && onDrag(componentName),
  });
  const component = usePageComponentStore(s => s[componentName]);
  return (
    <div ref={drag} className={componentStyle}>
      {component ? (
        <IconButton
          icon={component.getIcon()}
          className={cx(button, css({ width: '25px', height: '25px' }))}
          tooltip={componentName}
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
