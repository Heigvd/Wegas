import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerMapProps extends WegasComponentProps {
  input1: number;
}

function PlayerMap({ id, className, style }: PlayerMapProps) {
  const mapElement = React.useRef<HTMLDivElement>();

  return (
    <div
      ref={ref => {
        if (ref != null) {
          mapElement.current = ref;
        }
      }}
      id={id}
      className={className}
      style={style}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerMap,
    componentType: 'Advanced',
    name: 'Boxes',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      input1: schemaProps.code({ label: 'Layers' }),
      ...classStyleIdShema,
    },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({}),
  }),
);
