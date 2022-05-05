import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { ViewOptions } from 'ol/View';
import * as React from 'react';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import {
  mapOptionsSchema,
  viewOptionsSchema,
} from '../../Maps/helpers/schemas/MapSchemas';
import { WegasMap, WegasMapOptions } from '../../Maps/WegasMap';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

const defaultViewOptions: ViewOptions = {
  projection: 'EPSG:3857',
  zoom: 15,
  center: [775277, 5831039],
};

interface PlayerMapProps extends WegasComponentProps {
  mapOptions?: {
    [P in keyof WegasMapOptions]: WegasMapOptions[P] | IScript;
  };
  viewOptions?: {
    [P in keyof ViewOptions]: ViewOptions[P] | IScript;
  };
}

const initialLayers = [
  new TileLayer({
    source: new OSM(),
  }),
];

export default function PlayerMap({
  children,
  mapOptions: mapProps,
  viewOptions: viewProps,
}: PlayerMapProps) {
  const { mapOptions, viewOptions } = useDeepMemo({
    mapOptions: { ...mapProps, layers: initialLayers },
    viewOptions: { ...defaultViewOptions, ...viewProps },
  });
  const currentMapOptions = useScriptObjectWithFallback(mapOptions);
  const currentViewOptions = useScriptObjectWithFallback(viewOptions);

  return (
    <WegasMap
      mapOptions={currentMapOptions}
      viewOptions={currentViewOptions}
      debug
    >
      {children}
    </WegasMap>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerMap,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer: childrenDeserializerFactory(),
    },
    name: 'Map',
    icon: 'map',
    illustration: 'scatter',
    schema: { mapOptions: mapOptionsSchema, viewOptions: viewOptionsSchema },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      filterChildrenName: [
        'TileLayer',
        'Overlay',
        'ImageLayer',
        'VectorLayer',
        'Select',
      ],
    },
  }),
);
