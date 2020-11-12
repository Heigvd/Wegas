import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { useScript } from '../../Hooks/useScript';
import { emptyLayoutItemStyle } from '../Layouts/FlexList.component';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import {
  ComponentDropZone,
  useDndComponentDrop,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';
import { FlexItem, defaultFlexLayoutOptionsKeys } from '../../Layouts/FlexList';

const IfChildrenType = 'If component';
const emptyIfChildren = { type: IfChildrenType, props: {}, undeletable: true };
const ElseChildrenType = 'Else component';
const emptyElseChildren = {
  type: ElseChildrenType,
  props: {},
  undeletable: true,
};

interface EmptyCompoentContainerProps {
  path: number[];
  condition: 'IF' | 'ELSE';
}

export function EmptyComponentContainer({
  path,
  condition,
}: EmptyCompoentContainerProps) {
  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDelete, onDrop } = React.useContext(pageCTX);

  return (
    <FlexItem ref={dropZone} className={emptyLayoutItemStyle}>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDelete([...path, condition === 'IF' ? 0 : 1]);
          onDrop(dndComponent, path, condition === 'IF' ? 0 : 1);
        }}
        show={isOver}
        dropPosition="INTO"
      />
      {condition === 'IF'
        ? 'Drop the component to display when the condition is true'
        : 'Drop the component to display when the condition is false'}
    </FlexItem>
  );
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  ifCondition,
}: ChildrenDeserializerProps<IfElseProps>) {
  const condition = useScript<boolean>(ifCondition, context);
  const children1: WegasComponent =
    (wegasChildren != null && wegasChildren[0]) || emptyIfChildren;
  const children2: WegasComponent =
    (wegasChildren != null && wegasChildren[1]) || emptyElseChildren;

  if (editMode) {
    return (
      <>
        {children1.type === IfChildrenType ? (
          <EmptyComponentContainer path={path} condition="IF" />
        ) : (
          <PageDeserializer
            key={JSON.stringify([...path, 0])}
            pageId={pageId}
            path={[...path, 0]}
            uneditable={uneditable}
            context={context}
            Container={FlexItem}
            containerPropsKeys={defaultFlexLayoutOptionsKeys}
            dropzones={{}}
          />
        )}
        {children2.type === ElseChildrenType ? (
          <EmptyComponentContainer path={path} condition="ELSE" />
        ) : (
          <PageDeserializer
            key={JSON.stringify([...path, 1])}
            pageId={pageId}
            path={[...path, 1]}
            uneditable={uneditable}
            context={context}
            Container={FlexItem}
            containerPropsKeys={defaultFlexLayoutOptionsKeys}
            dropzones={{}}
          />
        )}
      </>
    );
  } else {
    const newPath = [...path, condition ? 0 : 1];
    const emptyChildren =
      wegasChildren == null ||
      wegasChildren[condition ? 0 : 1].type === IfChildrenType ||
      wegasChildren[condition ? 0 : 1].type === ElseChildrenType;
    return emptyChildren ? null : (
      <PageDeserializer
        key={JSON.stringify(newPath)}
        pageId={pageId}
        path={newPath}
        uneditable={uneditable}
        context={context}
        Container={FlexItem}
        containerPropsKeys={defaultFlexLayoutOptionsKeys}
        dropzones={{}}
      />
    );
  }
}

interface IfElseProps extends WegasComponentProps {
  ifCondition?: IScript;
}

function IfElse({ children }: IfElseProps) {
  return <>{children}</>;
}

registerComponent(
  pageComponentFactory({
    component: IfElse,
    componentType: 'Programmatic',
    container: {
      isVertical: () => false,
      ChildrenDeserializer,
      childrenSchema: [],
      noContainer: () => true,
    },
    name: 'If Else',
    icon: 'code',
    schema: {
      ifCondition: schemaProps.boolean({ label: 'If condition' }),
    },
    getComputedPropsFromVariable: () => ({
      children: [emptyIfChildren, emptyElseChildren],
    }),
  }),
);
