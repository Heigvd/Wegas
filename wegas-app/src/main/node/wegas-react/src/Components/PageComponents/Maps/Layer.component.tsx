import { isEqual } from 'lodash-es';
import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { useScript } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { WegasLayer } from '../../Maps/WegasLayer';
import { mapCTX } from '../../Maps/WegasMap';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { layerObjectToOLLayer } from './helpers/LayerHelpers';
import {
  wegasImageLayerSchema,
  wegasTileLayerSchema,
  wegasVectorLayerSchema,
} from './helpers/OLTypesSchemas';

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
