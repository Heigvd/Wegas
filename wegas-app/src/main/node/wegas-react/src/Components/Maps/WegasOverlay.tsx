//Other libs
import { Overlay } from 'ol';
import * as Easing from 'ol/easing';
import { PanIntoViewOptions } from 'ol/Overlay';
// React
import * as React from 'react';
import { createPortal } from 'react-dom';
import { mapCTX } from './WegasMap';

export interface WegasOverlayComponentProps {
  inputRef: React.LegacyRef<HTMLElement>;
}

/**
 * A react implementation of OpenLayer Overlay object
 * @link https://openlayers.org/en/latest/apidoc/module-ol_Overlay-Overlay.html
 */
export interface WegasOverlayProps {
  /**
   * The component that shows in the overlay
   */
  OverlayComponent: React.FunctionComponent<UknownValuesObject>;
  /**
   * Set the overlay id. The overlay id can be used with the module:ol/Map~Map#getOverlayById method.
   */
  id?: number | string;
  /**
   * CSS class name of the overlay (default : 'ol-overlay-container ol-selectable' )
   */
  className?: string;
  /**
   * The position of the overlay
   * if undefined, the overlay will not be show at first render
   */
  position?: PointLikeObject;
  /**
   * Offsets in pixels used when positioning the overlay. The first element in the array is the horizontal offset. A positive value shifts the overlay right. The second element in the array is the vertical offset. A positive value shifts the overlay down.
   */
  offset?: PointLikeObject;
  /**
   * Defines how the overlay is actually positioned with respect to its position property. Possible values are 'bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-center', 'center-right', 'top-left', 'top-center', and 'top-right'.
   */
  positioning?: PositioningOptions;
  /**
   * Whether event propagation to the map viewport should be stopped. If true the overlay is placed in the same container as that of the controls (CSS class name ol-overlaycontainer-stopevent); if false it is placed in the container with CSS class name specified by the className property.
   */
  stopEvent?: boolean;
  /**
   * Whether the overlay is inserted first in the overlay container, or appended. If the overlay is placed in the same container as that of the controls (see the stopEvent option) you will probably set insertFirst to true so the overlay is displayed below the controls.
   */
  insertFirst?: boolean;
  /**
   * Pan the map when calling setPosition (when changing position or clicking on map if positionOnClick), so that the overlay is entirely visible in the current viewport? If true (deprecated), then autoPanAnimation and autoPanMargin will be used to determine the panning parameters; if an object is supplied then other parameters are ignored.
   */
  autoPan?: AutoPanOptions;
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
