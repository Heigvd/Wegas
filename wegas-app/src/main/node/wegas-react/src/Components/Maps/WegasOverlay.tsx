//Other libs
import { Overlay } from 'ol';
import * as Easing from 'ol/easing';
import { Options, PanIntoViewOptions } from 'ol/Overlay';
// React
import * as React from 'react';
import { createPortal } from 'react-dom';
import { mapCTX } from './WegasMap';

/**
 * A react implementation of OpenLayer Overlay object
 * @link https://openlayers.org/en/latest/apidoc/module-ol_Overlay-Overlay.html
 */
export interface WegasOverlayProps extends Options {
  /**
   * The component that shows in the overlay
   */
  OverlayComponent: React.FunctionComponent<UknownValuesObject>;
  /**
   * Set the position of the overlay when a click occures on the map
   */
  positionOnClick?: boolean;
  /**
   * A function that returns if the overlay can't be placed on feature
   * if true, the overlay cannot be placed on any feature
   */
  featuresFilter?: FeatureFilter;
}

export function WegasOverlay({
  OverlayComponent,
  id,
  className,
  position,
  offset,
  positioning,
  stopEvent,
  insertFirst,
  autoPan: autoPanProp,
  positionOnClick,
  featuresFilter,
}: WegasOverlayProps) {
  const { map } = React.useContext(mapCTX);
  const overlayComponentRef = React.useRef<HTMLElement>(
    document.createElement('div'),
  );
  const overlayRef = React.useRef<Overlay>();

  React.useEffect(() => {
    if (overlayComponentRef.current) {
      let autoPan: PanIntoViewOptions | boolean | undefined = undefined;
      if (autoPanProp != null) {
        if (typeof autoPanProp === 'boolean') {
          autoPan = autoPanProp;
        } else {
          autoPan = { margin: autoPanProp.margin };
          if (autoPanProp.animation != null) {
            autoPan.animation = {
              duration: autoPanProp.animation.duration,
              easing: undefined,
            };
            const easingProp = autoPanProp.animation.easing;
            if (typeof easingProp === 'string') {
              autoPan.animation.easing = Easing[easingProp];
            } else {
              autoPan.animation.easing = easingProp;
            }
          }
        }
      }

      const overlay = new Overlay({
        id,
        className,
        offset,
        positioning,
        stopEvent,
        insertFirst,
        autoPan,
        element: overlayComponentRef.current,
      });

      overlayRef.current = overlay;

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
  }, [
    autoPanProp,
    className,
    featuresFilter,
    id,
    insertFirst,
    map,
    offset,
    positionOnClick,
    positioning,
    stopEvent,
  ]);

  React.useEffect(() => {
    if (overlayRef.current != null) {
      overlayRef.current.setPosition(position);
    }
  }, [position]);

  return (
    <div style={{ display: 'none' }}>
      {createPortal(<OverlayComponent />, overlayComponentRef.current)}
    </div>
  );
}
