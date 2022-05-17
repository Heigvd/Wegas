//Other libs
import BaseLayer, { Options } from 'ol/layer/Base';
import TileLayer from 'ol/layer/Tile';
import TileSource from 'ol/source/Tile';
// React
import * as React from 'react';
import { initializeProjection } from './helpers/proj4js';
import { mapCTX } from './WegasMap';

interface WegasLayerProps extends Options {
  layer: BaseLayer;
}

export function WegasLayer({ layer }: WegasLayerProps) {
  const { map } = React.useContext(mapCTX);

  React.useEffect(() => {
    const projectionCode = (layer as TileLayer<TileSource>)
      ?.getSource()
      ?.getProjection()
      ?.getCode();
    if (projectionCode != null) {
      initializeProjection(projectionCode);
    }
  }, [layer]);

  // As this effect mutates the DOM, useEffect causes the display to blink.
  // Using useLayoutEffect resolves this point as all DOM mutations done within the effect are made visible only after
  // the effect has been completed.
  React.useLayoutEffect(() => {
    map?.addLayer(layer);
    return () => {
      map?.removeLayer(layer);
    };
  }, [layer, map]);
  return null;
}
