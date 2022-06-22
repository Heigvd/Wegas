//Other libs
import { cx } from '@emotion/css';
import useResizeObserver from '@react-hook/resize-observer';
import { debounce } from 'lodash-es';
import { createEmpty, extend } from 'ol/extent';
import Feature from 'ol/Feature';
import { fromExtent } from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import 'ol/ol.css';
import { MapOptions } from 'ol/PluggableMap';
import { ProjectionLike } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import View, { ViewOptions } from 'ol/View';
// React
import * as React from 'react';
import { expandBoth, flex, flexRow, pointer } from '../../css/classes';
import {
  Authorization,
  authorizationsCTX,
} from '../Contexts/AuthorizationsProvider';
import { initializeProjection } from './helpers/proj4js';

interface MapContext {
  map?: Map;
  projection?: ProjectionLike;
}

export const mapCTX = React.createContext<MapContext>({});

export type OnMapClick = (
  coord: [number, number],
  features: {
    feature: Record<string, unknown>;
    layerId: string | undefined;
  }[],
) => void;

export type WegasMapOptions = Omit<
  MapOptions,
  'interactions' | 'layers' | 'overlays' | 'view'
> & {
  onClick?: OnMapClick;
};

interface WegasMapProps {
  mapOptions?: WegasMapOptions;
  viewOptions?: ViewOptions;
  debug?: boolean;
  OSMLayer?: boolean;
}

export function WegasMap({
  mapOptions,
  viewOptions,
  debug,
  OSMLayer,
  children,
}: React.PropsWithChildren<WegasMapProps>) {
  const [map, setMap] = React.useState<Map>();
  const [debugValues, setDebugValues] = React.useState({
    zoom: 0,
    center: [0, 0],
    extent: createEmpty(),
    resolution: 0,
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

  const displayMap =
    React.useContext(authorizationsCTX).authorizations.allowExternalUrl
    || !OSMLayer;

  React.useEffect(() => {
    if (typeof viewOptions?.projection === 'string') {
      initializeProjection(viewOptions.projection);
    }
  }, [viewOptions?.projection]);

  React.useEffect(() => {
    if (mapElementRef.current && displayMap) {
      // create map
      const initialMap = new Map({
        target: mapElementRef.current,
        view: new View(viewOptions),
        ...mapOptions,
        controls: mapOptions?.controls == null ? [] : mapOptions.controls,
        layers: OSMLayer ? [new TileLayer({ source: new OSM() })] : undefined,
      });

      if (debug) {
        initialMap.on('moveend', () => {
          setDebugValues(ov => ({
            zoom: initialMap.getView().getZoom() || ov.zoom,
            center: initialMap.getView().getCenter() || ov.center,
            extent: initialMap.getView().calculateExtent(initialMap.getSize()),
            resolution: initialMap.getView().getResolution() || -1,
          }));
        });
      }

      if (mapOptions?.onClick) {
        initialMap.on('click', event => {
          const coord = event.coordinate;
          const features: any[] = [];
          initialMap.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
            // extract props but do not expose the geometry
            const props = { ...feature.getProperties() };

            if (feature instanceof Feature) {
              delete props[feature.getGeometryName()];
            }

            features.push({
              feature: props,
              layerId: layer.get('layerId'),
            });
          });
          mapOptions!.onClick!([coord[0], coord[1]], features);
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
  }, [OSMLayer, debug, displayMap, mapOptions, viewOptions]);

  const zoomToLayersExentCb = React.useCallback(() => {
    if (map) {
      const extent = createEmpty();
      // compute extent from layers
      map.getAllLayers().forEach(l => {
        const source = l.getSource();
        if (source instanceof VectorSource) {
          const layerExtent = source.getExtent();
          extend(extent, layerExtent);
        }
      });
      const shape = fromExtent(extent);
      map.getView().fitInternal(shape);
    }
  }, [map]);

  return (
    <Authorization disabled={!OSMLayer} authorizationKey="allowExternalUrl">
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
              <li>{`center: [${debugValues.center.join(';')}]`}</li>
              <li>{`extent: [${debugValues.extent.join(';')}]`}</li>
              <li>{`resolution: [${debugValues.resolution}]`}</li>
            </ul>
            <div className={cx(pointer)} onClick={zoomToLayersExentCb}>
              Zoom to layers
            </div>
          </div>
        )}
        <div ref={mapElementRef} className={expandBoth}>
          <mapCTX.Provider value={{ map, projection: viewOptions?.projection }}>
            {children}
          </mapCTX.Provider>
        </div>
      </div>
    </Authorization>
  );
}
