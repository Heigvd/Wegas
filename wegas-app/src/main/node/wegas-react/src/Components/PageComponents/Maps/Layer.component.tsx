import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import { layerObjectsToOLLayer } from '../../Maps/helpers/LayerHelpers';
import {
  onLayerReadySchema,
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

type OnLayerReadyFN = ((layer: BaseLayer) => void) | undefined;

interface PlayerLayerProps extends WegasComponentProps {
  layerSource?: IScript | VectorLayerObject;
  layerStyle?: IScript | LayerStyleObject;
  onLayerReady?: IScript | OnLayerReadyFN;
}

export default function PlayerLayer({
  layerSource,
  layerStyle,
  onLayerReady,
  context,
  pageId,
  path,
}: PlayerLayerProps) {
  const [currentOLLayer, setCurrentOLLayer] = React.useState<BaseLayer>();
  const state = usePagesContextStateStore(s => s);
  const { projection } = React.useContext(mapCTX);

  const layerProps = useDeepMemo({ layerSource, layerStyle, onLayerReady });
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
        const onLayerReadyFN = currentLayerProps.onLayerReady;
        if (onLayerReadyFN != null) {
          onLayerReadyFN(newOLLayer);
          setInterval(() => {}, 1000);
        }
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
    name: 'WegasMapVectorLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasVectorLayerSchema,
      layerStyle: styleObjectSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'WegasMapTileLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasTileLayerSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerLayer,
    componentType: 'Maps',
    name: 'WegasMapImageLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasImageLayerSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);
