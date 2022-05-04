import { isEqual } from 'lodash-es';
import BaseLayer from 'ol/layer/Base';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { useScript } from '../../Hooks/useScript';
import { layerObjectsToOLLayer } from '../../Maps/helpers/LayerHelpers';
import {
  styleObjectSchema,
  wegasImageLayerSchema,
  wegasTileLayerSchema,
  wegasVectorLayerSchema,
} from '../../Maps/helpers/OLTypesSchemas';
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
  ///// SOURCE
  const layerSourceObjectRef = React.useRef<LayerSourceObject>();
  const scriptedLayerSource = useScript<LayerSourceObject>(
    entityIs(layerSource, 'Script') ? layerSource : undefined,
  );
  const currentLayerSource = entityIs(layerSource, 'Script')
    ? scriptedLayerSource
    : layerSource;

  ///// STYLE
  const layerStyleObjectRef = React.useRef<StyleObject>();
  const scriptedLayerStyle = useScript<StyleObject>(
    entityIs(layerStyle, 'Script') ? layerStyle : undefined,
  );
  const currentLayerStyle = entityIs(layerStyle, 'Script')
    ? scriptedLayerStyle
    : layerStyle;

  const [currentOLLayer, setCurrentOLLayer] = React.useState<BaseLayer>();
  const state = usePagesContextStateStore(s => s);
  const { projection } = React.useContext(mapCTX);

  React.useEffect(() => {
    if (currentLayerSource) {
      if (
        !isEqual(currentLayerSource, layerSourceObjectRef.current) ||
        !isEqual(currentLayerStyle, layerStyleObjectRef.current)
      ) {
        layerSourceObjectRef.current = currentLayerSource;
        layerStyleObjectRef.current = currentLayerStyle;
        layerObjectsToOLLayer(
          currentLayerSource,
          currentLayerStyle,
          context,
          state,
          projection,
        ).then(newOLLayer => {
          setCurrentOLLayer(newOLLayer);
        });
      }
    }
  }, [context, currentLayerSource, currentLayerStyle, projection, state]);

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
