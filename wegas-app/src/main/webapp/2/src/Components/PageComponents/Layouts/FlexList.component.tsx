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
  defaultFlexLayoutOptionsKeys,
  flexlayoutChoices,
} from '../../Layouts/FlexList';
import {
  ChildrenDeserializerProps,
  ComponentDropZone,
  DropZones,
  ItemContainer,
  ItemContainerPropsKeys,
  useDndComponentDrop,
  WegasComponentProps,
} from '../tools/EditableComponent';
import { PageDeserializer } from '../tools/PageDeserializer';
import { classAndStyleShema } from '../tools/options';
import { flex } from '../../../css/classes';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';

const emptyLayoutItemStyle: React.CSSProperties = {
  textAlign: 'center',
  verticalAlign: 'middle',
  borderStyle: 'solid',
  borderWidth: '1px',
  width: '100px',
  height: 'fit-content',
  overflowWrap: 'normal',
  zIndex: 0,
};

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
};

/**
 * EmptyPageComponentProps - The props needed for a virtual component (used in a layout when no children)
 */
export interface EmptyPageComponentProps {
  /**
   * path - the path of the current component
   */
  path: number[];
  /**
   * context - data that can be generated with programmatic components
   */
  context?: {
    [name: string]: unknown;
  };
  /**
   * Container - the container that is used to wrap the component
   */
  Container: ItemContainer;
}

export function EmptyComponentContainer({
  path,
  Container,
}: EmptyPageComponentProps) {
  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <Container ref={dropZone} className={flex} style={emptyLayoutItemStyle}>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDrop(dndComponent, path);
        }}
        show={isOver}
        dropPosition="INTO"
      />
      The layout is empty, drop components in to fill it!
    </Container>
  );
}

export function childrenDeserializerFactory(
  Container: ItemContainer = FlexItem,
  containerPropsKeys: ItemContainerPropsKeys = defaultFlexLayoutOptionsKeys,
  dropzones: DropZones = flexListItemDropZones,
  EmptyContainer: React.FunctionComponent<
    EmptyPageComponentProps
  > = EmptyComponentContainer,
) {
  return function ChildrenDeserializer({
    nbChildren,
    path,
    pageId,
    uneditable,
    context,
    editMode,
  }: ChildrenDeserializerProps<{}>) {
    const newChildren: JSX.Element[] = [];
    for (let i = 0; i < nbChildren; ++i) {
      newChildren.push(
        <PageDeserializer
          key={JSON.stringify([...path, i])}
          pageId={pageId}
          path={[...path, i]}
          uneditable={uneditable}
          context={context}
          Container={Container}
          containerPropsKeys={containerPropsKeys}
          dropzones={dropzones}
        />,
      );
    }
    return (
      <>
        {editMode && nbChildren === 0 ? (
          <EmptyContainer Container={Container} path={path} />
        ) : (
          newChildren
        )}
      </>
    );
  };
}

registerComponent(
  pageComponentFactory({
    component: PlayerFlexList,
    componentType: 'Layout',
    container: {
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(),
      childrenSchema: flexlayoutChoices,
    },
    name: 'FlexList',
    icon: 'bars',
    schema: { ...flexListSchema, ...classAndStyleShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
