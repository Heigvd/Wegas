//Other libs
import { Overlay } from 'ol';
// React
import * as React from 'react';
import { mapCTX } from './WegasMap';

export interface WegasOverlayComponentProps {
  inputRef: React.LegacyRef<HTMLElement>;
}

interface WegasOverlayProps {
  OverlayComponent: React.FunctionComponent<WegasOverlayComponentProps>;
  position?: [number, number];
}

export function WegasOverlay({
  OverlayComponent,
  position,
}: WegasOverlayProps) {
  const { map } = React.useContext(mapCTX);
  const overlayComponentRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (overlayComponentRef.current) {
      let overlay: Overlay;

      if (position == null && map != null) {
        overlay = new Overlay({
          element: overlayComponentRef.current,
        });

        map.on('click', function (evt) {
          if (overlayComponentRef.current) {
            // set overlay position
            const coordinate = evt.coordinate;
            overlay.setPosition(coordinate);

            // center overlay
            const elementSize =
              overlayComponentRef.current.getBoundingClientRect();
            overlay.setOffset([
              -elementSize.width / 2,
              -elementSize.height / 2,
            ]);

            // close overlay on click
            overlayComponentRef.current.onclick = function () {
              overlay.setPosition(undefined);
            };
          }
        });
      } else {
        overlay = new Overlay({
          element: overlayComponentRef.current,
          position,
        });
      }

      map?.addOverlay(overlay);
      return () => {
        map?.removeOverlay(overlay);
      };
    }
  }, [map, position]);

  return (
    <div style={{ display: 'none' }}>
      <OverlayComponent inputRef={overlayComponentRef} />
    </div>
  );
}
