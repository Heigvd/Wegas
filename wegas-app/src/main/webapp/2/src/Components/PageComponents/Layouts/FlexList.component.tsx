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
  flexlayoutChoices,
  defaultFlexLayoutOptionsKeys,
} from '../../Layouts/FlexList';
import {
  ComponentDropZone,
  DropZones,
  ItemContainer,
  useDndComponentDrop,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { classStyleIdShema } from '../tools/options';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { css } from 'emotion';

export const emptyLayoutItemStyle = css({
  display: 'flex',
  textAlign: 'center',
  verticalAlign: 'middle',
  borderStyle: 'solid',
  borderWidth: '1px',
  width: '120px',
  height: 'fit-content',
  overflowWrap: 'normal',
  zIndex: 0,
});

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
  /**
   * content - the content of the container
   * default :
   */
  content?: React.ReactNode;
}

export function EmptyComponentContainer({
  path,
  Container,
  content = 'The layout is empty, drop components in to fill it!',
}: EmptyPageComponentProps) {
  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <Container ref={dropZone} className={emptyLayoutItemStyle}>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDrop(dndComponent, path);
        }}
        show={isOver}
        dropPosition="INTO"
      />
      {content}
    </Container>
  );
}

export function childrenDeserializerFactory(
  Container: ItemContainer = FlexItem,
  dropzones: DropZones = flexListItemDropZones,
  EmptyContainer: React.FunctionComponent<EmptyPageComponentProps> = EmptyComponentContainer,
) {
  return function ChildrenDeserializer({
    wegasChildren,
    path,
    pageId,
    uneditable,
    context,
    editMode,
    containerPropsKeys,
  }: ChildrenDeserializerProps<{}>) {
    return (
      <>
        {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
          <EmptyContainer Container={Container} path={path} />
        ) : (
          wegasChildren?.map((_c, i) => {
            return (
              <PageDeserializer
                key={JSON.stringify([...path, i])}
                pageId={pageId}
                path={[...path, i]}
                uneditable={uneditable}
                context={context}
                Container={Container}
                containerPropsKeys={containerPropsKeys}
                dropzones={dropzones}
              />
            );
          })
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
      childrenLayoutKeys: defaultFlexLayoutOptionsKeys,
    },
    name: 'FlexList',
    icon: 'bars',
    schema: { ...flexListSchema, ...classStyleIdShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
