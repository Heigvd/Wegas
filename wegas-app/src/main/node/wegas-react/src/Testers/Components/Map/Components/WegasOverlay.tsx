//Other libs
import { Overlay } from 'ol';
import { FeatureLike } from 'ol/Feature';
// React
import * as React from 'react';
import { mapCTX } from './WegasMap';

export interface WegasOverlayComponentProps {
  inputRef: React.LegacyRef<HTMLElement>;
}

export interface WegasOverlayProps {
  /**
   * The component that shows in the overlay
   */
  OverlayComponent: React.FunctionComponent<WegasOverlayComponentProps>;
  /**
   * The position of the overlay
   * if undefined, the overlay will not be show at first render
   */
  initialPosition?: [number, number];
  /**
   * Set the position of the overlay when a click occures on the map
   */
  positionOnClick?: boolean;
  /**
   * A function that returns if the overlay can't be placed on feature
   * if true, the overlay cannot be placed on any feature
   */
  featuresFilter?:
    | { filter: (feature: FeatureLike) => boolean; allowClick: boolean }
    | true;
}

export function WegasOverlay({
  OverlayComponent,
  initialPosition: position,
  positionOnClick,
  featuresFilter,
}: WegasOverlayProps) {
  const { map } = React.useContext(mapCTX);
  const overlayComponentRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (overlayComponentRef.current) {
      const overlay = new Overlay({
        element: overlayComponentRef.current,
        position,
      });

      if (positionOnClick && map) {
        map.on('click', function (evt) {
          if (overlayComponentRef.current) {
            // get click position
            const coordinate = evt.coordinate;

            // Check if the overlay can be placed here
            let allowClick = true;
            if (featuresFilter != null) {
              let clickedFeatures = map.getFeaturesAtPixel(
                map.getPixelFromCoordinate(evt.coordinate),
              );

              // If featureFilter is an object, filter the features that blocks the click
              if (featuresFilter === true) {
                // If featureFilter is not an object then it is set to true and every features block the click
                allowClick = clickedFeatures.length === 0;
              } else {
                clickedFeatures = clickedFeatures.filter(featuresFilter.filter);
                if (featuresFilter.allowClick) {
                  allowClick = clickedFeatures.length > 0;
                } else {
                  allowClick = clickedFeatures.length === 0;
                }
              }
            }

            // avoid click on layers
            if (allowClick) {
              // set overlay position
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
          }
        });
      }

      map?.addOverlay(overlay);
      return () => {
        map?.removeOverlay(overlay);
      };
    }
  }, [featuresFilter, map, position, positionOnClick]);

  return (
    <div style={{ display: 'none' }}>
      <OverlayComponent inputRef={overlayComponentRef} />
    </div>
  );
}
