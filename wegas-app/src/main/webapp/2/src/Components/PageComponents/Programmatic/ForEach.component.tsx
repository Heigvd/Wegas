import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
} from '../../Layouts/FlexList';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface ForEachProps extends WegasComponentProps, FlexListProps {
  getItemsFn?: IScript;
  exposeAs: string;
}

function ForEach({
  ...flexListProps
}: ForEachProps) {
  return (
    <FlexList {...flexListProps} />
  );
}

registerComponent(
  pageComponentFactory({
    component: ForEach,
    componentType: 'Programmatic',
    containerType: 'FOREACH',
    name: 'For each',
    icon: 'code',
    schema: {
      ...flexListSchema,
      getItemsFn: schemaProps.customScript({
        label: 'Items',
        returnType: ['Readonly<object[]>'],
      }),
      exposeAs: schemaProps.string({
        label: 'Expose as',
        required: true,
        value: 'item',
      }),
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: () => ({ exposeAs: 'item' }),
  }),
);
