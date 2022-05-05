//Other libs
import { cx } from '@emotion/css';
import useResizeObserver from '@react-hook/resize-observer';
import { debounce } from 'lodash-es';
// Open layer
import { Collection } from 'ol';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import Map from 'ol/Map';
import { ProjectionLike } from 'ol/proj';
import View, { ViewOptions } from 'ol/View';
// React
import * as React from 'react';
import { expandBoth, flex, flexRow } from '../../css/classes';
import { wlog } from '../../Helper/wegaslog';

interface MapContext {
  map?: Map;
  projection?: ProjectionLike;
}

export const mapCTX = React.createContext<MapContext>({});

interface WegasMapProps {
  options: ViewOptions;
  initialLayers?: BaseLayer[] | Collection<BaseLayer> | LayerGroup;
  debug?: boolean;
}

export function WegasMap({
  options,
  initialLayers,
  children,
  debug,
}: React.PropsWithChildren<WegasMapProps>) {
  const [map, setMap] = React.useState<Map>();
  const mapElementRef = React.useRef<HTMLDivElement>(null);
  const containerElementRef = React.useRef<HTMLDivElement>(null);

  const debouncedMapResize = React.useMemo(
    () =>
      debounce(() => {
        if (map != null) {
          map.updateSize();
        }
      }, 100),
    [map],
  );

  useResizeObserver(mapElementRef, debouncedMapResize);

  React.useEffect(() => {
    if (mapElementRef.current) {
      // create map
      const initialMap = new Map({
        target: mapElementRef.current,
        layers: initialLayers,
        view: new View(options),
        controls: [],
      });

      if (debug) {
        initialMap.on('moveend', () => {
          wlog({
            zoom: initialMap.getView().getZoom(),
            center: initialMap.getView().getCenter(),
          });
        });
      }

      //   // map click handler
      //   const handleMapClick = (event: any) => {
      //     // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
      //     //  https://stackoverflow.com/a/60643670
      //     const clickedCoord = initialMap.getCoordinateFromPixel(event.pixel);

      //     if (clickedCoord) {
      //       // transform coord to EPSG 4326 standard Lat Long (WGS 84)
      //       const transormedCoord = transform(
      //         clickedCoord,
      //         'EPSG:3857',
      //         'EPSG:4326',
      //       );

      //       // setSelectedCoord(transormedCoord);
      //     }
      //   };

      //   // set map onclick handler
      //   initialMap.on('click', handleMapClick);

      // setZoom(initialMap.getView().getZoom() || 0);

      // initialMap.on('moveend', function () {
      //   setZoom(initialMap.getView().getZoom() || 0);
      // });

      // const ol3d = new OLCesium({ initialMap }); // ol2dMap is the ol.Map instance
      // const scene = ol3d.getCesiumScene();
      // scene.terrainProvider = Cesium.createWorldTerrain();
      // ol3d.setEnabled(false);

      // // save map and vector layer references to state
      setMap(initialMap);

      // wlog(1);

      return () => {
        initialMap.dispose();
      };
    }
  }, [debug, initialLayers, options]);

  // render component
  return (
    <div ref={containerElementRef} className={cx(flex, flexRow, expandBoth)}>
      <div ref={mapElementRef} className={expandBoth}>
        <mapCTX.Provider value={{ map, projection: options.projection }}>
          {children}
        </mapCTX.Provider>
      </div>
    </div>
  );
}
