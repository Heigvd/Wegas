import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { useScript } from '../../Hooks/useScript';
import {
  defaultFlexLayoutOptionsKeys,
  FlexItem,
  flexlayoutChoices,
  FlexList,
  FlexListProps,
  flexListSchema,
  isVertical,
} from '../../Layouts/FlexList';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

interface ForEachProps extends WegasComponentProps, FlexListProps {
  getItemsFn?: IScript;
  exposeAs: string;
  itemKey: string;
  itemsOnly?: boolean;
}

function ForEach({ itemsOnly, ...props }: ForEachProps) {
  return itemsOnly ? <>{props.children}</> : <FlexList {...props} />;
}

function ChildrenDeserializer({
  path,
  pageId,
  uneditable,
  context,
  exposeAs,
  itemKey,
  getItemsFn,
  editMode,
  inheritedOptionsState,
  wegasChildren,
}: ChildrenDeserializerProps<ForEachProps>) {
  const items = useScript<{ [key: string]: any }[]>(getItemsFn, context);
  let children: JSX.Element[] = [];

  if (items == undefined) {
    return <UncompleteCompMessage />;
  } else {
    children = items.map((item, index) => {
      const newContext = { ...context, [exposeAs]: item };

      let key = '';
      try {
        key = JSON.stringify(item[itemKey]);
      } catch (_e) {
        key = JSON.stringify([...(path ? path : []), index]);
      }

      return editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer
          key={key}
          Container={FlexItem}
          path={path}
          content={
            'Place a component that you want to duplicate for each item of the For Each'
          }
        />
      ) : (
        <PageDeserializer
          key={key}
          pageId={pageId}
          path={[...(path ? path : []), 0]}
          uneditable={uneditable}
          context={newContext}
          Container={FlexItem}
          containerPropsKeys={defaultFlexLayoutOptionsKeys}
          dropzones={{}}
          inheritedOptionsState={inheritedOptionsState}
        />
      );
    });
  }
  return <>{editMode === false ? children : children.slice(0, 1)}</>;
}

function noContainer(props: ForEachProps) {
  return props.itemsOnly === true;
}

registerComponent(
  pageComponentFactory({
    component: ForEach,
    componentType: 'Programmatic',
    container: {
      isVertical,
      ChildrenDeserializer,
      noContainer,
      childrenSchema: flexlayoutChoices,
    },
    name: 'For each',
    icon: 'code',
    illustration: 'forEach',
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
      itemKey: schemaProps.string({
        label: 'Key',
        required: true,
        value: 'id',
      }),
      itemsOnly: schemaProps.boolean({ label: 'Items only' }),
      ...classStyleIdShema,
    },
    getComputedPropsFromVariable: () => ({ exposeAs: 'item', children: [] }),
  }),
);
