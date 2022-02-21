import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { useScript } from '../../Hooks/useScript';
import { defaultFlexLayoutOptionsKeys, FlexItem } from '../../Layouts/FlexList';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
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

function IfElse({ children }: IfElseProps) {
  return <>{children}</>;
}

function PlayerIf({ children }: WegasComponentProps) {
  return <>{children}</>;
}
const PlayerIfName = 'PlayerIf';

function PlayerElse({ children }: WegasComponentProps) {
  return <>{children}</>;
}
const PlayerElseName = 'PlayerElse';

registerComponent(
  pageComponentFactory({
    component: PlayerIf,
    componentType: 'Utility',
    container: {},
    name: PlayerIfName,
    icon: 'code',
    illustration: 'ifElse',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowChildren: wegasComponent =>
        wegasComponent.props.children == null ||
        wegasComponent.props.children.length === 0,
      allowEdit: () => false,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerElse,
    componentType: 'Utility',
    container: {},
    name: PlayerElseName,
    icon: 'code',
    illustration: 'ifElse',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowChildren: wegasComponent =>
        wegasComponent.props.children == null ||
        wegasComponent.props.children.length === 0,
      allowEdit: () => false,
    },
  }),
);

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

  if (wegasChildren != null) {
    const children1 = wegasChildren[0];
    const children2 = wegasChildren[1];
    if (condition == null) {
      return <UncompleteCompMessage pageId={pageId} path={path} />;
    } else if (editMode) {
      return (
        <>
          {children1.type === PlayerIfName ? (
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
          {children2.type === PlayerElseName ? (
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
        wegasChildren[condition ? 0 : 1].type === PlayerIfName ||
        wegasChildren[condition ? 0 : 1].type === PlayerElseName;
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
  } else {
    return <pre>Error in component</pre>;
  }
}

interface IfElseProps extends WegasComponentProps {
  ifCondition?: IScript;
}

registerComponent(
  pageComponentFactory({
    component: IfElse,
    componentType: 'Programmatic',
    container: {
      isVertical: () => false,
      ChildrenDeserializer,
    },
    name: 'If Else',
    icon: 'code',
    illustration: 'ifElse',
    schema: {
      ifCondition: schemaProps.script({
        label: 'If condition',
        mode: 'GET_CLIENT',
      }),
    },
    getComputedPropsFromVariable: () => ({
      children: [
        { type: PlayerIfName, props: { children: [] } },
        { type: PlayerElseName, props: { children: [] } },
      ],
    }),
  }),
);
