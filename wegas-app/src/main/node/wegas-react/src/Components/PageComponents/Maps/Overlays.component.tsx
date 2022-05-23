import { transform } from 'ol/proj';
import * as React from 'react';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { useScript } from '../../Hooks/useScript';
import { projectionSchema } from '../../Maps/helpers/schemas/HelperSchemas';
import { mapCTX } from '../../Maps/WegasMap';
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
  exposedValueKeys?: {
    exposePayloadAs: string;
    exposeResolutionAs: string;
    exposeMapCoordAs: string;
  };
  projection?: string;
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
  itemKey,
  getItemsFn,
  exposedValueKeys,
  projection,
  editMode,
  inheritedOptionsState,
  wegasChildren,
}: ChildrenDeserializerProps<PlayerOverlaysProps>) {
  const { forEach } = useInternalTranslate(pagesTranslations);
  const { map } = React.useContext(mapCTX);
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
    const {
      exposePayloadAs = 'payload',
      exposeResolutionAs = 'resolution',
      exposeMapCoordAs = 'mapCoord',
    } = exposedValueKeys || {};

    children = items.map((item, index) => {
      let position = item.overlayProps.position;
      if (map != null && projection != null) {
        position = transform(
          position,
          projection,
          map.getView().getProjection(),
        ) as PointLikeObject;
      }

      const newContext = {
        ...context,
        [exposePayloadAs]: item.payload,
        [exposeResolutionAs]: map?.getView().getResolution(),
        [exposeMapCoordAs]: position,
      };

      let key = undefined;
      try {
        key = JSON.stringify(item.payload[itemKey]);
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
          <WegasOverlay {...item.overlayProps} position={position} key={key}>
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
      itemKey: schemaProps.string({
        label: 'Payload key',
        required: true,
        value: 'id',
      }),
      exposedValueKeys: schemaProps.hashlist({
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
          {
            label: 'Expose resolution as',
            value: {
              prop: 'exposeResolutionAs',
              schema: schemaProps.string({
                label: 'Expose resolution as',
                required: true,
                value: 'resolution',
              }),
            },
          },
          {
            label: 'Expose map coordinate as',
            value: {
              prop: 'exposeMapCoordAs',
              schema: schemaProps.string({
                label: 'Expose map coordinate as',
                required: true,
                value: 'mapCoord',
              }),
            },
          },
        ],
      }),
      projection: projectionSchema('Projection'),
    },
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
