import { isEqual } from 'lodash-es';
import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { AvailableSchemas } from '../../../Editor/Components/FormView';
import { useScript } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { WegasLayer } from '../../Maps/WegasLayer';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { LayerObject } from './helpers/LayerTypes';
import {
  extentSchema,
  layerObjectToOLLayer,
  pointSchema,
} from './helpers/OLHelpers';

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

  React.useEffect(() => {
    if (currentLayer) {
      if (!isEqual(currentLayer, layerObjectRef.current)) {
        layerObjectToOLLayer(currentLayer, context, state).then(newOLLayer => {
          layerObjectRef.current = currentLayer;
          setCurrentOLLayer(newOLLayer);
        });
      }
    }
  }, [context, currentLayer, state]);

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
          projection: schemaProps.string({ label: 'Projection' }),
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
