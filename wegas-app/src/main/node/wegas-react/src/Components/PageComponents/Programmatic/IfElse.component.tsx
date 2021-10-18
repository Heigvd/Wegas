import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import {
  createComponent,
  deleteComponent,
  pageCTX,
} from '../../../Editor/Components/Page/PageEditor';
import { findComponent } from '../../../Helper/pages';
import { useScript } from '../../Hooks/useScript';
import { defaultFlexLayoutOptionsKeys, FlexItem } from '../../Layouts/FlexList';
import { emptyLayoutItemStyle } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  ComponentDropZone,
  useDndComponentIsOverFactory,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

const IfChildrenType = 'If component';
const emptyIfChildren: WegasComponent = {
  type: IfChildrenType,
  props: {},
  uneditable: true,
};
const ElseChildrenType = 'Else component';
const emptyElseChildren: WegasComponent = {
  type: ElseChildrenType,
  props: {},
  uneditable: true,
};

interface EmptyCompoentContainerProps {
  path: number[];
  condition: 'IF' | 'ELSE';
}

export function EmptyComponentContainer({
  path,
  condition,
}: EmptyCompoentContainerProps) {
  // const [{ isOver }, dropZone] = useDndComponentDrop();
  const { isOver, ref } = useDndComponentIsOverFactory();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <FlexItem ref={ref} className={emptyLayoutItemStyle}>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDrop(
            dndComponent,
            path,
            condition === 'IF' ? 0 : 1,
            undefined,
            true,
          );
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

function deleteChildren(page: WegasComponent, path: number[]) {
  const { component } = findComponent(page, path);

  const index = path.slice(-1)[0];
  const deletedCompPage = deleteComponent(page, path);
  if (
    deletedCompPage != null &&
    component?.type !== IfChildrenType &&
    component?.type !== ElseChildrenType
  ) {
    if (index < 2) {
      return createComponent(
        deletedCompPage,
        path.slice(0, -1),
        index === 0 ? IfChildrenType : ElseChildrenType,
        undefined,
        index,
      )?.newPage;
    }
  }
  return deletedCompPage;
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  inheritedOptionsState,
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
            key={JSON.stringify([...path, 0]) + JSON.stringify(context)}
            pageId={pageId}
            path={[...path, 0]}
            uneditable={uneditable}
            context={context}
            Container={FlexItem}
            containerPropsKeys={defaultFlexLayoutOptionsKeys}
            dropzones={{}}
            inheritedOptionsState={inheritedOptionsState}
          />
        )}
        {children2.type === ElseChildrenType ? (
          <EmptyComponentContainer path={path} condition="ELSE" />
        ) : (
          <PageDeserializer
            key={JSON.stringify([...path, 1]) + JSON.stringify(context)}
            pageId={pageId}
            path={[...path, 1]}
            uneditable={uneditable}
            context={context}
            Container={FlexItem}
            containerPropsKeys={defaultFlexLayoutOptionsKeys}
            dropzones={{}}
            inheritedOptionsState={inheritedOptionsState}
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
        inheritedOptionsState={inheritedOptionsState}
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
      // noContainer: () => true,
      deleteChildren,
    },
    name: 'If Else',
    icon: 'code',
    illustration: 'ifElse',
    schema: {
      ifCondition: schemaProps.script({ label: 'If condition', mode: 'GET' }),
    },
    getComputedPropsFromVariable: () => ({
      children: [emptyIfChildren, emptyElseChildren],
    }),
  }),
);
