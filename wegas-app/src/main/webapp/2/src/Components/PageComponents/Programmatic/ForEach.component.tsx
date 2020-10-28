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
} from '../../Layouts/FlexList';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import {
  ChildrenDeserializerProps,
  WegasComponentProps,
} from '../tools/EditableComponent';
import { classAndStyleShema } from '../tools/options';
import { PageDeserializer } from '../tools/PageDeserializer';
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
}: ChildrenDeserializerProps<ForEachProps>) {
  const items = useScript<object[]>(getItemsFn);
  let children: JSX.Element[] = [];

  if (items) {
    children = items.map((item, id) => {
      const newContext = { ...context, [exposeAs]: item };
      return (
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
      type: 'FOREACH',
      isVertical,
      ChildrenDeserializer,
      noContainer,
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
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: () => ({ exposeAs: 'item' }),
  }),
);
