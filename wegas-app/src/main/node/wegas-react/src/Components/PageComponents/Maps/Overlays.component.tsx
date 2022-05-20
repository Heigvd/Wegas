import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import { WegasOverlay } from '../../Maps/WegasOverlay';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  DummyContainer,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

interface PlayerOverlaysProps extends WegasComponentProps {
  getItemsFn?: IScript;
  exposeAs: string;
  itemKey: string;
}

export default function PlayerOverlays({ children }: PlayerOverlaysProps) {
  return <>{children}</>;
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
}: ChildrenDeserializerProps<PlayerOverlaysProps>) {
  const items = useScript<{ [key: string]: any }[]>(getItemsFn, context);
  let children: JSX.Element[] = [];

  if (items == undefined) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else {
    children = items.map((item, index) => {
      const newContext = { ...context, [exposeAs]: item };

      let key = '';
      try {
        key = JSON.stringify(item[itemKey]);
      } catch (_e) {
        key = JSON.stringify([...(path ? path : []), index]);
      }

      debugger;

      const childrenContent: JSX.Element =
        editMode && (!wegasChildren || wegasChildren.length === 0) ? (
          <EmptyComponentContainer
            Container={DummyContainer}
            path={path}
            content={
              'Place a component that you want to duplicate for each item of the For Each'
            }
          />
        ) : (
          <PageDeserializer
            pageId={pageId}
            path={[...(path ? path : []), 0]}
            uneditable={uneditable}
            context={newContext}
            dropzones={{}}
            inheritedOptionsState={inheritedOptionsState}
          />
        );

      return (
        <WegasOverlay {...item.overlayProps} key={key}>
          {childrenContent}
        </WegasOverlay>
      );
    });
  }
  return <>{editMode === false ? children : children.slice(0, 1)}</>;
}

registerComponent(
  pageComponentFactory({
    component: PlayerOverlays,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer,
    },
    id: 'WegasMapOverlays',
    name: 'Overlays',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      getItemsFn: schemaProps.customScript({
        label: 'Items',
        language: 'TypeScript',
        returnType: ['Readonly<object&{overlayProps:OverlayProps}[]>'],
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
    },
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
