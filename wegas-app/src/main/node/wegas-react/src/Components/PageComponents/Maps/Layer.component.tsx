import { isEqual } from 'lodash-es';
import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { AvailableSchemas } from '../../../Editor/Components/FormView';
import { useScript } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { WegasLayer } from '../../Maps/WegasLayer';
import { mapCTX } from '../../Maps/WegasMap';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { LayerObject } from './helpers/LayerTypes';
import { layerObjectToOLLayer } from './helpers/OLHelpers';

interface PlayerLayerProps extends WegasComponentProps {
  layer?: IScript | LayerObject;
}

export default function PlayerLayer({ layer, context }: PlayerLayerProps) {
  const layerObjectRef = React.useRef<LayerObject>();
  const scriptedLayer = useScript<LayerObject>(
    entityIs(layer, 'Script') ? layer : undefined,
  );
  const currentLayer = entityIs(layer, 'Script') ? scriptedLayer : layer;
  const [currentOLLayer, setCurrentOLLayer] = React.useState<BaseLayer>();
  const state = usePagesContextStateStore(s => s);
  const { projection } = React.useContext(mapCTX);

  React.useEffect(() => {
    if (currentLayer) {
      if (!isEqual(currentLayer, layerObjectRef.current)) {
        layerObjectToOLLayer(currentLayer, context, state, projection).then(
          newOLLayer => {
            layerObjectRef.current = currentLayer;
            setCurrentOLLayer(newOLLayer);
          },
        );
      }
    }
  }, [context, currentLayer, projection, state]);

  if (currentOLLayer == null) {
    return <TumbleLoader />;
  } else {
    return <WegasLayer layer={currentOLLayer} />;
  }
}

const wegasTileLayerSchema: { [prop: string]: AvailableSchemas } = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'TileLayer' }),
      source: {
        type: 'object',
        properties: {
          type: schemaProps.hidden({ type: 'string', value: 'Tiff' }),
          normalize: schemaProps.boolean({
            label: 'Normalize',
            required: false,
          }),
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: schemaProps.scriptPath({ label: 'File' }),
              },
            },
            view: {
              label: 'Sources',
              type: 'array',
            },
          },
        },
      },
    },
  },
};

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'TileLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: wegasTileLayerSchema,
  }),
);

/**
const wegasImageLayerSchema: { [prop: string]: AvailableSchemas } = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'ImageLayer' }),
      source: {
        type: 'object',
        properties: {
          type: schemaProps.hidden({ type: 'string', value: 'Static' }),
          url: schemaProps.scriptPath({ label: 'File', required: true }),
          projection: {
            type: 'object',
            view: {
              label: 'Projection',
            },
            properties: {
              code: schemaProps.string({ label: 'code', value: 'xkcd-image' }),
              units: schemaProps.select({
                label: 'Units',
                values: [
                  'radians',
                  'degrees',
                  'ft',
                  'm',
                  'pixels',
                  'tile-pixels',
                  'us-ft',
                ],
              }),
              extent: extentSchema('Extent'),
            },
          },
          imageExtent: extentSchema('Image extent'),
          imageSize: pointSchema('Image size'),
        },
      },
    },
  },
};

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'ImageLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: wegasImageLayerSchema,
  }),
);

 */

const wegasVectorLayerSchema: { [prop: string]: AvailableSchemas } = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'VectorLayer' }),
      dataType: schemaProps.select({
        label: 'Data type',
        values: ['OSM', 'GeoJSON'],
        value: 'GeoJSON',
      }),
      source: {
        type: ['object', 'string'],
        view: {
          type: 'scriptable',
          label: 'Source',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['string', 'object'],
          },
          literalSchema: schemaProps.path({
            label: 'Data file',
            required: false,
          }),
        },
      },
      sourceProjection: schemaProps.string({
        label: 'Source projection',
        required: false,
      }),
    },
  },
};

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'VectorLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: wegasVectorLayerSchema,
  }),
);

// registerComponent(
//   pageComponentFactory({
//     component: PlayerLayer,
//     componentType: 'Maps',
//     name: 'Layer',
//     icon: 'map',
//     illustration: 'scatter',
//     schema: {
//       layerType: schemaProps.select({
//         label: 'Layer type',
//         values: ['ImageLayer', 'TileLayer', 'VectorLayer'],
//       }),
//     },
//     allowedVariables: [],
//     getComputedPropsFromVariable: () => ({}),
//     behaviour: {
//       filterChildrenName: ['Test'],
//     },
//   }),
// );
