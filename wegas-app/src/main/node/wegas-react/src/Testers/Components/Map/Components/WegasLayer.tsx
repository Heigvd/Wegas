//Other libs
import BaseLayer from 'ol/layer/Base';
// React
import * as React from 'react';
import { wlog } from '../../../../Helper/wegaslog';
import { mapCTX } from './WegasMap';

interface WegasLayerProps {
  layer: BaseLayer;
}

export function WegasLayer({ layer }: WegasLayerProps) {
  const { map } = React.useContext(mapCTX);

  React.useEffect(() => {
    map?.addLayer(layer);
    wlog(map?.getAllLayers());
  }, [layer, map]);
  return null;
}
