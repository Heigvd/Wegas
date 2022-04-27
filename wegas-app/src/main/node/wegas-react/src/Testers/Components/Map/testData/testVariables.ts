////////////////////////////////////////////////////////////////
// Open layers
// format
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
// layer
import VectorLayer from 'ol/layer/Vector';
import { register } from 'ol/proj/proj4';
// source
import VectorSource from 'ol/source/Vector';
// style
import { Fill, Icon, Stroke, Style } from 'ol/style';
// external tools
import osmtogeojson from 'osmtogeojson';
import proj4 from 'proj4';
/////////////////////////////////////////////////////////////////
// Data
import GEOJSONBuildings_LV95 from './batiment_schweiz.json';
import GEOJSONTrees from './GEOJSONTrees.json';
import OSMBuildings from './OSMBuildings.json';
import GEOJSONBuildings_WGS84 from './swiss_wgs84_buildings.json';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
);

register(proj4);

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
    { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' },
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

const swissBuildingLayerSource = new VectorSource({
  features: new GeoJSON().readFeatures(GEOJSONBuildings_LV95, {
    dataProjection: 'EPSG:2056',
    featureProjection: 'EPSG:3857',
  }),
});

const swissBuildingLayerStyle = new Style({
  fill: new Fill({
    color: 'rgba(0, 255, 0, 0.1)',
  }),
  // renderer: function (pixelCoordinates, state) {
  //   const context = state.context;
  //   const geometry = state.geometry.clone();
  //   geometry.setCoordinates(pixelCoordinates);
  //   const extent = geometry.getExtent();
  //   const width = getWidth(extent);
  //   const height = getHeight(extent);
  //   const flag = state.feature.get('flag');
  //   if (!flag || height < 1 || width < 1) {
  //     return;
  //   }

  //   // Stitch out country shape from the blue canvas
  //   context.save();
  //   const renderContext = toContext(context, {
  //     pixelRatio: 1,
  //   });
  //   renderContext.setFillStrokeStyle(fill, stroke);
  //   renderContext.drawGeometry(geometry);
  //   context.clip();

  //   // Fill transparent country with the flag image
  //   const bottomLeft = getBottomLeft(extent);
  //   const left = bottomLeft[0];
  //   const bottom = bottomLeft[1];
  //   context.drawImage(flag, left, bottom, width, height);
  //   context.restore();
  // },
});

export const swissBuildingLayer = new VectorLayer({
  source: swissBuildingLayerSource,
  style: swissBuildingLayerStyle,
});

const swissBuildingLayerSourceWGS84 = new VectorSource({
  features: new GeoJSON().readFeatures(GEOJSONBuildings_WGS84, {
    // dataProjection: 'EPSG:2056',
    featureProjection: 'EPSG:3857',
  }),
});

const swissBuildingLayerStyleWGS84 = [
  new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 3,
    }),
  }),
  new Style({
    stroke: new Stroke({
      color: 'pink',
      width: 2,
    }),
  }),
];

export const swissBuildingLayerWGS84 = new VectorLayer({
  source: swissBuildingLayerSourceWGS84,
  style: swissBuildingLayerStyleWGS84,
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
