import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { ViewOptions } from 'ol/View';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { useScript } from '../../Hooks/useScript';
// import { useScript } from '../../Hooks/useScript';
import { WegasMap } from '../../Maps/WegasMap';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { mapSchema } from './helpers/OLTypesSchemas';

const defaultOptions: ViewOptions = {
  // projection: 'EPSG:4326',
  projection: 'EPSG:3857',
  center: [6.961834028944175, 46.313121655957694],
  zoom: 4,
};

interface PlayerMapProps extends WegasComponentProps {
  // inbox?: IScript;
  mapOptions: IScript | ViewOptions;
}

export default function PlayerMap({ children, mapOptions }: PlayerMapProps) {
  const scriptedOptions = useScript<ViewOptions>(
    entityIs(mapOptions, 'Script') ? mapOptions : undefined,
  );
  const currentOptions = entityIs(mapOptions, 'Script')
    ? scriptedOptions
    : mapOptions;

  return (
    <WegasMap
      options={{ ...defaultOptions, ...currentOptions }}
      // options={defaultOptions}
      initialLayers={[
        new TileLayer({
          source: new OSM(),
        }),
      ]}
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
    schema: { mapOptions: mapSchema },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      filterChildrenName: [
        'Layer',
        'TileLayer',
        'Overlay',
        'ImageLayer',
        'VectorLayer',
      ],
    },
  }),
);
