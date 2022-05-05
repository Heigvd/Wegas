import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import { layerObjectsToOLLayer } from '../../Maps/helpers/LayerHelpers';
import {
  wegasImageLayerSchema,
  wegasTileLayerSchema,
  wegasVectorLayerSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { styleObjectSchema } from '../../Maps/helpers/schemas/StyleSchemas';
import { WegasLayer } from '../../Maps/WegasLayer';
import { mapCTX } from '../../Maps/WegasMap';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerLayerProps extends WegasComponentProps {
  layerSource?: IScript | LayerSourceObject;
  layerStyle?: IScript | LayerStyleObject;
}

export default function PlayerLayer({
  layerSource,
  layerStyle,
  context,
  pageId,
  path,
}: PlayerLayerProps) {
  const [currentOLLayer, setCurrentOLLayer] = React.useState<BaseLayer>();
  const state = usePagesContextStateStore(s => s);
  const { projection } = React.useContext(mapCTX);

  const layerProps = useDeepMemo({ layerSource, layerStyle });
  const currentLayerProps = useScriptObjectWithFallback(layerProps);

  React.useEffect(() => {
    if (currentLayerProps.layerSource != null) {
      layerObjectsToOLLayer(
        currentLayerProps.layerSource,
        currentLayerProps.layerStyle,
        context,
        state,
        projection,
      ).then(newOLLayer => {
        setCurrentOLLayer(newOLLayer);
      });
    }
  }, [context, currentLayerProps, projection, state]);

  if (currentOLLayer == null) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
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
    schema: {
      layerSource: wegasTileLayerSchema,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'ImageLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasImageLayerSchema,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'VectorLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasVectorLayerSchema,
      layerStyle: styleObjectSchema,
    },
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
