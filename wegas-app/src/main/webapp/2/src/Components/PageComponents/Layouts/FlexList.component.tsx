import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
} from '../../Layouts/FlexList';
import { WegasComponentProps } from '../tools/EditableComponent';
//import { SListDescriptor } from 'wegas-ts-api';

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
  pageComponentFactory({
    component: PlayerFlexList,
    componentType: 'Layout',
    containerType: 'FLEX',
    name: 'FlexList',
    icon: 'bars',
    schema: flexListSchema,
    //  allowedVariables: ['ListDescriptor'],
    //    get: (val?: Readonly<SListDescriptor>) =>
    //      val
    //        ? {
    //          children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
    //        }
    //        : {
    //          children: [],
    //        },
  }),
);
