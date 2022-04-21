//Other libs
import { cx } from '@emotion/css';
// Open layer
import { Collection } from 'ol';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import Map from 'ol/Map';
import { transform } from 'ol/proj';
import View, { ViewOptions } from 'ol/View';
// React
import * as React from 'react';
import { expandBoth, flex, flexRow } from '../../../../css/classes';
import { wlog } from '../../../../Helper/wegaslog';

interface MapContext {
  map?: Map;
}

export const mapCTX = React.createContext<MapContext>({});

interface WegasMapProps {
  options: ViewOptions;
  initialLayers?: BaseLayer[] | Collection<BaseLayer> | LayerGroup;
}

export function WegasMap({
  options,
  initialLayers,
  children,
}: React.PropsWithChildren<WegasMapProps>) {
  // const [mode3d, setmode3d] = React.useState(false);
  const [map, setMap] = React.useState<Map>();
  // const [selectedCoord, setSelectedCoord] = React.useState<Coordinate>();
  // const [zoom, setZoom] = React.useState(0);

  const mapElement = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (mapElement.current) {
      // create map
      const initialMap = new Map({
        target: mapElement.current,
        layers: initialLayers,
        view: new View(options),
        controls: [],
      });

      // map click handler
      const handleMapClick = (event: any) => {
        // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
        //  https://stackoverflow.com/a/60643670
        const clickedCoord = initialMap.getCoordinateFromPixel(event.pixel);

        wlog(clickedCoord);

        if (clickedCoord) {
          // transform coord to EPSG 4326 standard Lat Long (WGS 84)
          const transormedCoord = transform(
            clickedCoord,
            'EPSG:3857',
            'EPSG:4326',
          );

          // setSelectedCoord(transormedCoord);

          wlog(transormedCoord);
        }
      };

      // set map onclick handler
      initialMap.on('click', handleMapClick);

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
    }
  }, [initialLayers, options]);

  // render component
  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div ref={mapElement} className={expandBoth}>
        <mapCTX.Provider value={{ map }}>{children}</mapCTX.Provider>
      </div>
    </div>
  );
}
