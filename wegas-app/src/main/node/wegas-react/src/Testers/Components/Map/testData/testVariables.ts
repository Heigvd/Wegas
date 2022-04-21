////////////////////////////////////////////////////////////////
// Open layers
// format
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
// layer
import VectorLayer from 'ol/layer/Vector';
// source
import VectorSource from 'ol/source/Vector';
// style
import { Fill, Icon, Stroke, Style } from 'ol/style';
// external tools
import osmtogeojson from 'osmtogeojson';
/////////////////////////////////////////////////////////////////
// Data
import GEOJSONTrees from './GEOJSONTrees.json';
import OSMBuildings from './OSMBuildings.json';

// Buildings
const buildingLayerSource = new VectorSource({
  features: new GeoJSON().readFeatures(
    osmtogeojson(OSMBuildings, {
      flatProperties: false,
      deduplicator: undefined,
      polygonFeatures: undefined,
      uninterestingTags: undefined,
      verbose: false,
    }),
  ),
});

const buildingLayerStyle = new Style({
  stroke: new Stroke({
    color: 'magenta',
    width: 2,
  }),
  fill: new Fill({
    color: 'rgba(255, 255, 0, 0.1)',
  }),
});

export const buildingLayer = new VectorLayer({
  source: buildingLayerSource,
  style: buildingLayerStyle,
});

// Trees
const treeLayerSource = new VectorSource({
  features: new GeoJSON().readFeatures(GEOJSONTrees),
});

function treeLayerStyleFN(_feature: Feature, resolution: number) {
  return new Style({
    image: new Icon({
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.0000001 / resolution,
      src: require('./tree.png').default,
    }),
  });
}

export const treeLayer = new VectorLayer({
  source: treeLayerSource,
  style: treeLayerStyleFN,
});

// Selection
export const selectStyle = new Style({
  stroke: new Stroke({
    color: 'green',
    width: 2,
  }),
});
