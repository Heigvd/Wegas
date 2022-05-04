////////////////////////////////////////////////////////////////
// Open layers
// layer
import { cx } from '@emotion/css';
import LayerTile from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
// source
import SourceOSM from 'ol/source/OSM';
/////////////////////////////////////////////////////////////////
// React
import * as React from 'react';
import { WegasLayer } from '../../../Components/Maps/WegasLayer';
import { WegasMap } from '../../../Components/Maps/WegasMap';
import { WegasOverlay } from '../../../Components/Maps/WegasOverlay';
import { WegasSelect } from '../../../Components/Maps/WegasSelect';
import { expandBoth, flex, flexColumn } from '../../../css/classes';
import {
  buildingLayer,
  selectStyle,
  swissBuildingLayer,
  swissBuildingLayerWGS84,
  treeLayer,
} from './testData/testVariables';

function overlayFactory(
  backgroundColor: React.CSSProperties['backgroundColor'],
) {
  return function Overlay() {
    return (
      <div
        style={{
          width: '50px',
          height: '50px',
          backgroundColor,
          borderRadius: '50%',
          textAlign: 'center',
          lineHeight: '50px',
        }}
      >
        Overlay
      </div>
    );
  };
}

// type OverlayMode =
//   | 'Everywhere'
//   | 'Not on buildings'
//   | 'Not on any feature'
//   | 'Only on a feature';

// const featureFilterFactory: Record<
//   OverlayMode,
//   WegasOverlayProps['featuresFilter']
// > = {
//   Everywhere: undefined,
//   'Not on buildings': {
//     filter: feature => feature.getProperties().tags.building === 'yes',
//     allowClick: false,
//   },
//   'Not on any feature': true,
//   'Only on a feature': { filter: () => false, allowClick: true },
// };

const position = fromLonLat([6.961834028944175, 46.313121655957694]);

const defaultMapOptions = {
  // projection: 'EPSG:4326',
  projection: 'EPSG:3857',
  center: position,
  zoom: 16,
};

export default function MapTester() {
  // const [selectedOverlayMode, setSelectedOverlayMode] =
  //   React.useState<OverlayMode>('Everywhere');

  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      {/* <div className={cx(flex, flexRow)}>
        Allow the overlay popping :
        <Selector
          value={selectedOverlayMode}
          choices={[
            {
              label: 'Everywhere',
              value: 'Everywhere',
            },
            {
              label: 'Not on buildings',
              value: 'Not on buildings',
            },
            {
              label: 'Not on any feature',
              value: 'Not on any feature',
            },
            {
              label: 'Only on a feature',
              value: 'Only on a feature',
            },
          ]}
          onChange={choice => {
            if (choice != null) {
              setSelectedOverlayMode(choice as OverlayMode);
            }
          }}
        />
      </div> */}
      <WegasMap
        options={defaultMapOptions}
        initialLayers={[
          new LayerTile({
            source: new SourceOSM(),
          }),
        ]}
      >
        <WegasLayer layer={swissBuildingLayerWGS84} />
        <WegasLayer layer={swissBuildingLayer} />
        {/* <WegasLayer layer={buildingLayer} /> */}
        <WegasLayer layer={treeLayer} />
        {/* Useless overlay, no position and no position on click */}
        <WegasOverlay OverlayComponent={overlayFactory('red')} />
        {/* Static overlay overlay, no position and no position on click */}
        <WegasOverlay
          OverlayComponent={overlayFactory('rgb(125,0,0,0.5)')}
          position={position as [number, number]}
          // initialPosition={position.map((v) => v) as [number, number]}
        />
        {/* Movable overlay, can be clicked everywhere */}
        <WegasOverlay
          OverlayComponent={overlayFactory('rgb(0,200,0,0.5)')}
          positionOnClick
        />
        <WegasSelect selectStyle={selectStyle} layers={[buildingLayer]} />
      </WegasMap>
    </div>
  );
}
