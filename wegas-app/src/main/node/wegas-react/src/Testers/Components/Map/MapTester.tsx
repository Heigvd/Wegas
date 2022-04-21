////////////////////////////////////////////////////////////////
// Open layers
// layer
import LayerTile from 'ol/layer/Tile';
// source
import SourceOSM from 'ol/source/OSM';
/////////////////////////////////////////////////////////////////
// React
import * as React from 'react';
import { WegasLayer } from './Components/WegasLayer';
import { WegasMap } from './Components/WegasMap';
import { buildingLayer, treeLayer } from './testData/testVariables';

export default function MapTester() {
  return (
    <WegasMap
      options={{
        projection: 'EPSG:4326',
        center: [6.961834028944175, 46.313121655957694],
        zoom: 16,
      }}
      initialLayers={[
        new LayerTile({
          source: new SourceOSM(),
        }),
      ]}
    >
      <WegasLayer layer={buildingLayer} />
      <WegasLayer layer={treeLayer} />
    </WegasMap>
  );
}
