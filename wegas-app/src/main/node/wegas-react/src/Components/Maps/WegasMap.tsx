//Other libs
import { cx } from '@emotion/css';
import useResizeObserver from '@react-hook/resize-observer';
import { debounce } from 'lodash-es';
import Map from 'ol/Map';
import { MapOptions } from 'ol/PluggableMap';
import { ProjectionLike } from 'ol/proj';
import View, { ViewOptions } from 'ol/View';
// React
import * as React from 'react';
import { expandBoth, flex, flexRow } from '../../css/classes';

interface MapContext {
  map?: Map;
  projection?: ProjectionLike;
}

export const mapCTX = React.createContext<MapContext>({});

export type WegasMapOptions = Omit<
  MapOptions,
  'controls' | 'interactions' | 'layers' | 'overlays' | 'view'
>;

interface WegasMapProps {
  mapOptions?: WegasMapOptions;
  viewOptions?: ViewOptions;
  debug?: boolean;
}

export function WegasMap({
  mapOptions,
  viewOptions,
  children,
  debug,
}: React.PropsWithChildren<WegasMapProps>) {
  const [map, setMap] = React.useState<Map>();
  const [debugValues, setDebugValues] = React.useState({
    zoom: 0,
    center: [0, 0],
  });
  const mapElementRef = React.useRef<HTMLDivElement>(null);

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
        view: new View(viewOptions),
        ...mapOptions,
        controls: [],
      });

      if (debug) {
        initialMap.on('moveend', () => {
          setDebugValues(ov => ({
            zoom: initialMap.getView().getZoom() || ov.zoom,
            center: initialMap.getView().getCenter() || ov.center,
          }));
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
  }, [debug, mapOptions, viewOptions]);

  // render component
  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      {debug && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(100,100,100,0.8)',
            color: 'white',
            padding: '5px',
          }}
        >
          <ul>
            <li>{`zoom: ${debugValues.zoom}`}</li>
            <li>{`position: [${debugValues.center.join(';')}]`}</li>
          </ul>
        </div>
      )}
      <div ref={mapElementRef} className={expandBoth}>
        <mapCTX.Provider value={{ map, projection: viewOptions?.projection }}>
          {children}
        </mapCTX.Provider>
      </div>
    </div>
  );
}
