import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import {
  FlexListProps,
  FlexList,
  flexDirectionValues,
  flexWrapValues,
  justifyContentValues,
  alignItemsValues,
  alignContentValues,
} from '../../Layouts/FlexList';
import { WegasComponentProps } from '../tools/EditableComponent';
import { SListDescriptor } from 'wegas-ts-api';

interface PlayerFlexListProps extends FlexListProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerFlexList(props: PlayerFlexListProps) {
  return <FlexList {...props} />;
}

registerComponent(
  pageComponentFactory(
    PlayerFlexList,
    'Layout',
    'FlexList',
    'bars',
    {
      layout: schemaProps.hashlist('List layout properties', false, [
        {
          label: 'Direction',
          value: {
            prop: 'flexDirection',
            schema: schemaProps.select('Direction', false, flexDirectionValues),
          },
        },
        {
          label: 'Wrap',
          value: {
            prop: 'flexWrap',
            schema: schemaProps.select('Wrap', false, flexWrapValues, 'string'),
          },
        },
        {
          label: 'Justify content',
          value: {
            prop: 'justifyContent',
            schema: schemaProps.select(
              'Justify content',
              false,
              justifyContentValues,
            ),
          },
        },
        {
          label: 'Align items',
          value: {
            prop: 'alignItems',
            schema: schemaProps.select('Align items', false, alignItemsValues),
          },
        },
        {
          label: 'Align content',
          value: {
            prop: 'alignContent',
            schema: schemaProps.select(
              'Align content',
              false,
              alignContentValues,
            ),
          },
        },
      ]),
      children: schemaProps.hidden(false),
    },
    ['SListDescriptor'],
    (val?: Readonly<SListDescriptor>) =>
      val
        ? {
          // children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
          children: [],
        }
        : {
          children: [],
        },
    'FLEX',
  ),
);
