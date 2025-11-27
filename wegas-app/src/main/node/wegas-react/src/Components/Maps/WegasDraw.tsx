import { Draw } from 'ol/interaction';
import { DrawEvent, Options } from 'ol/interaction/Draw';
import * as React from 'react';
import { mapCTX } from './WegasMap';
import { wlog } from '../../Helper/wegaslog';

/**
 * A react implementation of OpenLayer Draw object
 * @link https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-Draw.html
 * @link https://openlayers.org/en/latest/examples/draw-features.html
 */
export interface WegasDrawProps extends Options {
  onDrawEnd?: (event : DrawEvent) => void;
  onDrawStart?: (event : DrawEvent) => void;
  onDrawAbort?: (event : DrawEvent) => void;
}

export function WegasDraw({ onDrawEnd, onDrawStart, onDrawAbort, ...drawOptions }: WegasDrawProps) {
  const { map } = React.useContext(mapCTX);
  React.useEffect(() => {
    if (map) {
      if(drawOptions.type === undefined){
        drawOptions.type = 'Point';
      }
      drawOptions.finishCondition = ((e) => {
        wlog('event', e);
        return false;
      });

      const draw = new Draw(drawOptions);
      map.addInteraction(draw);

      if (onDrawEnd) {
        draw.on('drawend', onDrawEnd);
      }
      if(onDrawStart) {
        draw.on('drawstart', onDrawStart);
      }
      if(onDrawAbort) {
        draw.on('drawabort', onDrawAbort);
      }

      return () => {
        map.removeInteraction(draw);
      };
    }
  }, [map, onDrawEnd, drawOptions]);

  return null;
}
