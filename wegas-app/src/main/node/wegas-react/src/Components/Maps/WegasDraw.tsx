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

  const drawInteraction = React.useRef<Draw>();

  React.useEffect(() => {
    if (map) {
      if(drawOptions.type === undefined){
        drawOptions.type = 'Point';
      }

      const draw = new Draw(drawOptions);
      map.addInteraction(draw);
      drawInteraction.current = draw;

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
        draw.abortDrawing();
        map.removeInteraction(draw);
      };
    }
  }, [map, onDrawEnd, onDrawStart, onDrawAbort, drawOptions]);

  const escapeListener = React.useCallback((event: KeyboardEvent) => {
      wlog(event.key)
      if(event.code === 'Escape' && drawInteraction.current){
        wlog('stopping interaction')
        drawInteraction.current.abortDrawing();
      }
    },
    [drawInteraction.current],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', escapeListener);
    return () => {
      window.removeEventListener('keydown', escapeListener);
    };
  }, [escapeListener]);

  return null;
}
