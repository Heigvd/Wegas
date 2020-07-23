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
import { WegasFunctionnalComponentProps } from '../tools/EditableComponent';
import { SListDescriptor } from 'wegas-ts-api/typings/WegasScriptableEntities';

interface PlayerFlexListProps
  extends FlexListProps,
    WegasFunctionnalComponentProps {
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
    flexListSchema,
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
