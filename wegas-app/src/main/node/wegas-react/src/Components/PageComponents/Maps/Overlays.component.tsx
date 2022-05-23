import * as React from 'react';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
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
  const { forEach } = useInternalTranslate(pagesTranslations);
  // const { map } = React.useContext(mapCTX);
  const items = useScript<OverlayItem[]>(getItemsFn, context);
  let children: JSX.Element[] = [];

  if (items == undefined) {
    return (
      <UncompleteCompMessage
        message={forEach.noItems}
        pageId={pageId}
        path={path}
      />
    );
  } else {
    children = items.map((item, index) => {
      const newContext = { ...context, [exposeAs]: { item } };

      let key = item.payLoad[itemKey];
      try {
        key = JSON.stringify(item.payLoad[itemKey]);
      } catch (_e) {
        key = undefined;
      }

      if (typeof key !== 'string' && typeof key !== 'number') {
        return (
          <UncompleteCompMessage
            key={JSON.stringify([...(path ? path : []), index])}
            message={forEach.noKey(index)}
            pageId={pageId}
            path={path}
          />
        );
      } else {
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
      }
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
        returnType: ['Readonly<OverlayItem[]>'],
      }),
      exposeAs: schemaProps.string({
        label: 'Expose as',
        required: true,
        value: 'item',
      }),
      itemKey: schemaProps.string({
        label: 'Payload key',
        required: true,
        value: 'id',
      }),
      exposedValues: schemaProps.hashlist({
        label: 'Exposed values',
        choices: [
          {
            label: 'Expose payload as',
            value: {
              prop: 'exposePayloadAs',
              schema: schemaProps.string({
                label: 'Expose payload as',
                required: true,
                value: 'payload',
              }),
            },
          },
        ],
      }),
    },
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
