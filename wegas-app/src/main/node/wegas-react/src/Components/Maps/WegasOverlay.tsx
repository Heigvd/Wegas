//Other libs
import { Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import * as Easing from 'ol/easing';
import { Options, PanIntoViewOptions } from 'ol/Overlay';
import { ProjectionLike, transform } from 'ol/proj';
// React
import * as React from 'react';
import { createPortal } from 'react-dom';
import { mapCTX } from './WegasMap';

/**
 * A react implementation of OpenLayer Overlay object
 * @link https://openlayers.org/en/latest/apidoc/module-ol_Overlay-Overlay.html
 */
export interface WegasOverlayProps
  extends React.PropsWithChildren<Omit<Options, 'autoPan' | 'element'>> {
  /**
   * The projection in witch the position is given
   */
  projection?: ProjectionLike;
  /**
   * Pan the map when calling setPosition, so that the overlay is entirely visible in the current viewport?
   */
  autoPan?: AutoPanOptions;
  /**
   * Set the position of the overlay when a click occures on the map
   */
  positionOnClick?: boolean;
  /**
   * A function that returns if the overlay can't be placed on feature
   * if true, the overlay cannot be placed on any feature
   * if false or undefined, the overlay can be placed everywhere
   */
  featuresFilter?: FeatureFilter;
  /**
   * A callback function triggered when the overlay position changes
   */
  onPositionChange?: (position?: Coordinate) => void;
}

export function WegasOverlay({
  id,
  className,
  position,
  projection,
  offset,
  positioning,
  stopEvent,
  insertFirst,
  autoPan: autoPanProp,
  positionOnClick,
  featuresFilter,
  onPositionChange,
  children,
}: WegasOverlayProps): JSX.Element {
  const { map } = React.useContext(mapCTX);
  const overlayComponentRef = React.useRef<HTMLElement>(
    document.createElement('div'),
  );
  const [olOverlay, setOlOverlay] = React.useState<Overlay>();

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
      if (map) {
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

        setOlOverlay(overlay);

        overlay.on('change:position', event => {
          if (onPositionChange) {
            onPositionChange((event.target as Overlay).getPosition());
          }
        });

        if (positionOnClick) {
          map.on('click', function (evt) {
            // get click position
            const coordinate = evt.coordinate;

            // if (onPositionChange != null) {
            //   onPositionChange(coordinate);
            // }

            if (overlayComponentRef.current) {
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
                  clickedFeatures = clickedFeatures.filter(
                    featuresFilter.filter,
                  );
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
    }
  }, [
    autoPanProp,
    className,
    featuresFilter,
    id,
    insertFirst,
    map,
    offset,
    onPositionChange,
    positionOnClick,
    positioning,
    stopEvent,
  ]);

  React.useEffect(() => {
    if (olOverlay != null) {
      let computedPosition = position;
      if (position != null && map != null && projection != null) {
        computedPosition = transform(
          position,
          projection,
          map.getView().getProjection(),
        ) as PointLikeObject;
      }
      olOverlay.setPosition(computedPosition);
    }
  }, [map, olOverlay, position, projection]);

  if (map != null) {
    return (
      <div style={{ display: 'none' }}>
        {createPortal(children, overlayComponentRef.current)}
      </div>
    );
  } else {
    return <>{children}</>;
  }
}
