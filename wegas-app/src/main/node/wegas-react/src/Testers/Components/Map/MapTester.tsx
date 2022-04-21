////////////////////////////////////////////////////////////////
// Open layers
// layer
import LayerTile from 'ol/layer/Tile';
// source
import SourceOSM from 'ol/source/OSM';
/////////////////////////////////////////////////////////////////
// React
import * as React from 'react';
import { WegasLayer } from './Components/WegasLayer';
import { WegasMap } from './Components/WegasMap';
import {
  WegasOverlay,
  WegasOverlayComponentProps,
} from './Components/WegasOverlay';
import { WegasSelect } from './Components/WegasSelect';
import {
  buildingLayer,
  selectStyle,
  treeLayer,
} from './testData/testVariables';

function overlayFactory(
  backgroundColor: React.CSSProperties['backgroundColor'],
) {
  return function Overlay({ inputRef }: WegasOverlayComponentProps) {
    return (
      <div
        ref={inputRef as React.LegacyRef<HTMLDivElement>}
        style={{
          width: '100px',
          height: '100px',
          backgroundColor,
          borderRadius: '50%',
          textAlign: 'center',
          lineHeight: '100px',
        }}
      >
        blablab
      </div>
    );
  };
}

export default function MapTester() {
  return (
    <WegasMap
      options={{
        projection: 'EPSG:4326',
        center: [6.961834028944175, 46.313121655957694],
        zoom: 16,
      }}
      initialLayers={[
        new LayerTile({
          source: new SourceOSM(),
        }),
      ]}
    >
      <WegasLayer layer={buildingLayer} />
      <WegasLayer layer={treeLayer} />
      <WegasOverlay
        OverlayComponent={overlayFactory('rgb(125,0,0,0.5)')}
        position={[6.961834028944175, 46.313121655957694]}
      />
      <WegasOverlay OverlayComponent={overlayFactory('green')} />
      <WegasSelect selectStyle={selectStyle} layers={[buildingLayer]} />
    </WegasMap>
  );
}
