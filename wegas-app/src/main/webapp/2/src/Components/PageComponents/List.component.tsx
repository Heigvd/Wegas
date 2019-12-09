import * as React from 'react';
import { pageComponentFactory, registerComponent } from './componentFactory';
import List, { ListProps } from '../AutoImport/Layout/List';
import {
  EditableComponent,
  EditableComponentCallbacks,
} from './EditableComponent';
import { schemaProps } from './schemaProps';

type PlayerListProps = ListProps & EditableComponentCallbacks;

const PalyerList: React.FunctionComponent<PlayerListProps> = (
  props: PlayerListProps,
) => {
  const { children, horizontal = false, style } = props;
  return (
    <EditableComponent {...props} wegasChildren={children} componentName="List">
      {children => (
        <List horizontal={horizontal} style={style}>
          {children}
        </List>
      )}
    </EditableComponent>
  );
};

const ListComponent = pageComponentFactory(
  PalyerList,
  'bars',
  {
    description: 'List',
    properties: {
      style: schemaProps.code('Style', 'JSON'),
      horizontal: schemaProps.boolean('Horizontal'),
    },
  },
  ['ISBooleanInstance'],
  (val?: Readonly<ISBooleanInstance>) => ({
    children: [],
    horizontal: val ? val.value : undefined,
  }),
);

registerComponent('List', ListComponent);
