//Other libs
import BaseLayer, { Options } from 'ol/layer/Base';
// React
import * as React from 'react';
import { mapCTX } from './WegasMap';

interface WegasLayerProps extends Options {
  layer: BaseLayer;
}

export function WegasLayer({ layer }: WegasLayerProps) {
  const { map } = React.useContext(mapCTX);

  React.useEffect(() => {
    map?.addLayer(layer);
    return () => {
      map?.removeLayer(layer);
    };
  }, [layer, map]);
  return null;
}
