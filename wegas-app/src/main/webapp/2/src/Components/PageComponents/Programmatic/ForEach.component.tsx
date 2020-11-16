import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { useScript } from '../../Hooks/useScript';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
  isVertical,
  FlexItem,
  defaultFlexLayoutOptionsKeys,
  flexlayoutChoices,
} from '../../Layouts/FlexList';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classAndStyleShema } from '../tools/options';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

interface ForEachProps extends WegasComponentProps, FlexListProps {
  getItemsFn?: IScript;
  exposeAs: string;
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
  getItemsFn,
  editMode,
  wegasChildren,
}: ChildrenDeserializerProps<ForEachProps>) {
  const items = useScript<object[]>(getItemsFn, context);
  let children: JSX.Element[] = [];

  if (items) {
    children = items.map((item, id) => {
      const newContext = { ...context, [exposeAs]: item };
      return editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer
          Container={FlexItem}
          path={path}
          content={
            'Place a component that you want to duplicate for each item of the Fore Each'
          }
        />
      ) : (
        <PageDeserializer
          key={JSON.stringify([...(path ? path : []), id])}
          pageId={pageId}
          path={[...(path ? path : []), 0]}
          uneditable={uneditable}
          context={newContext}
          Container={FlexItem}
          containerPropsKeys={defaultFlexLayoutOptionsKeys}
          dropzones={{}}
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
      itemsOnly: schemaProps.boolean({ label: 'Items only' }),
      ...classAndStyleShema,
    },
    getComputedPropsFromVariable: () => ({ exposeAs: 'item', children: [] }),
  }),
);
