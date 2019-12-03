import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { pageComponentFactory, registerComponent } from './componentFactory';
import List, { ListProps } from '../AutoImport/Layout/List';

const PalyerList: React.FunctionComponent<ListProps> = ({
  children,
  horizontal = false,
  style,
}: ListProps) => {
  return (
    <List horizontal={horizontal} style={style}>
      {children}
    </List>
  );
};

const ListComponent = pageComponentFactory(
  PalyerList,
  'bars',
  {
    description: 'List',
    properties: {
      variable: {
        enum: ['INTERNAL', 'PROTECTED', 'INHERITED', 'PRIVATE'],
        required: false,
        type: 'string',
        view: {
          choices: [
            {
              label: 'Model',
              value: 'INTERNAL',
            },
            {
              label: 'Protected',
              value: 'PROTECTED',
            },
            {
              label: 'Inherited',
              value: 'INHERITED',
            },
            {
              label: 'Private',
              value: 'PRIVATE',
            },
          ],
          featureLevel: 'DEFAULT',
          index: 0,
          label: 'Variable',
          type: 'select',
        },
      },
      label: {
        required: false,
        type: 'string',
        view: {
          featureLevel: 'DEFAULT',
          index: 1,
          label: 'Label',
        },
      },
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  variable => ({
    variable: variable,
    label: TranslatableContent.toString(variable.label),
    children: [],
  }),
);

registerComponent('List', ListComponent);
