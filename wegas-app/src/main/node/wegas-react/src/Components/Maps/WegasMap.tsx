//Other libs
import { cx } from '@emotion/css';
import useResizeObserver from '@react-hook/resize-observer';
import { debounce } from 'lodash-es';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import { MapOptions } from 'ol/PluggableMap';
import { ProjectionLike } from 'ol/proj';
import OSM from 'ol/source/OSM';
import View, { ViewOptions } from 'ol/View';
// React
import * as React from 'react';
import {
  expandBoth,
  flex,
  flexRow,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { Button } from '../Inputs/Buttons/Button';
import './helpers/proj4js';

interface MapContext {
  map?: Map;
  projection?: ProjectionLike;
}

export const mapCTX = React.createContext<MapContext>({});

export type WegasMapOptions = Omit<
  MapOptions,
  'interactions' | 'layers' | 'overlays' | 'view'
>;

interface WegasMapProps {
  mapOptions?: WegasMapOptions;
  viewOptions?: ViewOptions;
  debug?: boolean;
  OSMLayer?: boolean;
}

let globalOSMSourcesAllowed: boolean | undefined = undefined;

export function WegasMap({
  mapOptions,
  viewOptions,
  debug,
  OSMLayer,
  children,
}: React.PropsWithChildren<WegasMapProps>) {
  const [OSMSourcesAllowed, setOSMSourcesAllowed] = React.useState(
    globalOSMSourcesAllowed,
  );
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
    globalOSMSourcesAllowed = OSMSourcesAllowed;
  }, [OSMSourcesAllowed]);

  React.useEffect(() => {
    if (mapElementRef.current && OSMSourcesAllowed === true) {
      // create map
      const initialMap = new Map({
        target: mapElementRef.current,
        view: new View(viewOptions),
        ...mapOptions,
        controls: mapOptions?.controls == null ? [] : mapOptions.controls,
        layers:
          OSMLayer != null ? [new TileLayer({ source: new OSM() })] : undefined,
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
  }, [OSMLayer, OSMSourcesAllowed, debug, mapOptions, viewOptions]);

  if (!OSMSourcesAllowed) {
    return (
      <div className={cx(flex, flexRow, expandBoth, justifyCenter, itemCenter)}>
        <div>
          <p>
            {OSMSourcesAllowed === undefined
              ? 'You choose to use Open Street Map data. You are about to to communicate with OSM server, do you allow this action?'
              : 'You cannot use this component because you refused to communicate with an external server. If you wish to change your mind, you still can use the accept button below'}
          </p>
          <div className={cx(flex, justifyCenter)}>
            <Button label="Accept" onClick={() => setOSMSourcesAllowed(true)} />
            <Button
              label="Refuse"
              onClick={() => setOSMSourcesAllowed(false)}
            />
          </div>
        </div>
      </div>
    );
  } else {
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
}
