import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
  isVertical,
  FlexItem,
  defaultFlexLayoutOptionsKeys
} from '../../Layouts/FlexList';
import { ChildrenDeserializerProps, ContainerTypes, DropZones, ItemContainer, ItemContainerPropsKeys, WegasComponentProps } from '../tools/EditableComponent';
import { PageDeserializer } from '../tools/PageDeserializer';

interface PlayerFlexListProps extends FlexListProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerFlexList(props: PlayerFlexListProps) {
  return <FlexList {...props} />;
}

const flexListItemDropZones: DropZones = {
  side: true,
}

export function childrenDeserializerFactory(childrenType: ContainerTypes, Container: ItemContainer = FlexItem, containerPropsKeys: ItemContainerPropsKeys = defaultFlexLayoutOptionsKeys, dropzones: DropZones = flexListItemDropZones) {
  return function ChildrenDeserializer({ nbChildren, path, pageId, uneditable, context }: ChildrenDeserializerProps<{}>) {
    const newChildren: JSX.Element[] = [];
    for (let i = 0; i < nbChildren; ++i) {
      newChildren.push(
        <PageDeserializer
          key={JSON.stringify([...(path ? path : []), i])}
          pageId={pageId}
          path={[...(path ? path : []), i]}
          uneditable={uneditable}
          childrenType={childrenType}
          context={context}
          Container={Container}
          containerPropsKeys={containerPropsKeys}
          dropzones={dropzones}
        />,
      );
    }
    return <>{newChildren}</>;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerFlexList,
    componentType: 'Layout',
    container: { type: 'FLEX', isVertical, ChildrenDeserializer: childrenDeserializerFactory("FLEX") },
    name: 'FlexList',
    icon: 'bars',
    schema: flexListSchema,
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
