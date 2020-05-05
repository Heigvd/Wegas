import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';

function PlayerFlexList({ className, children }: WegasComponentProps) {
  return <div className={className}>{children}</div>;
}

registerComponent(
  pageComponentFactory(
    PlayerFlexList,
    'AbsoluteLayout',
    'bars',
    {
      name: schemaProps.string('Name', false),
      children: schemaProps.hidden(false),
    },
    ['ISListDescriptor'],
    (val?: Readonly<ISListDescriptor>) =>
      val
        ? {
            // children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
            children: [],
          }
        : {
            children: [],
          },
    'ABSOLUTE',
  ),
);
