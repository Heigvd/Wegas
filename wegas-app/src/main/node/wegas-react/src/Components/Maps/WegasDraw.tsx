import { Draw } from 'ol/interaction';
import { DrawEvent, Options } from 'ol/interaction/Draw';
import * as React from 'react';
import { mapCTX } from './WegasMap';
import { primaryAction } from 'ol/events/condition';
import { MapBrowserEvent } from 'ol';

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
      // ignore right clicks
      drawOptions.condition = (event: MapBrowserEvent) => primaryAction(event);

      const draw = new Draw(drawOptions);
      map.addInteraction(draw);

      if(onDrawEnd) {
        draw.on('drawend', onDrawEnd);
      }
      if(onDrawStart) {
        draw.on('drawstart', onDrawStart);
      }
      if(onDrawAbort) {
        draw.on('drawabort', onDrawAbort);
      }

      const handleContextMenu = (_evt: any) => {
        draw.abortDrawing();
      };

      const escapeListener = (event: KeyboardEvent) => {
        if(event.code === 'Escape'){
          draw.abortDrawing();
        }
      }

      const viewPort = map.getViewport();
      viewPort.addEventListener('contextmenu', handleContextMenu);
      viewPort.addEventListener('keydown', escapeListener);
      // required to listen to keyboard events
      viewPort.tabIndex = 32767;

      return () => {
        draw.abortDrawing();
        viewPort.removeEventListener('contextmenu', handleContextMenu);
        viewPort.removeEventListener('keydown', escapeListener);
        map.removeInteraction(draw);
      };
    }
  }, [map, onDrawEnd, onDrawStart, onDrawAbort, drawOptions]);

  return null;
}
