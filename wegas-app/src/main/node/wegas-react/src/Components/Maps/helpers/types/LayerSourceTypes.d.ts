//////////// Tile layer
interface OSMSourceObject {
  type: 'OSM';
}

interface BingSourceObject {
  type: 'Bing';
  key: string;
  imagerySet:
    | 'RoadOnDemand'
    | 'Aerial'
    | 'AerialWithLabelsOnDemand'
    | 'CanvasDark'
    | 'OrdnanceSurvey';
}

interface TiffSourceObject {
  type: 'Tiff';
  normalize?: boolean;
  sources: { url: IScript }[];
}

interface TileLayerObject {
  type: 'TileLayer';
  source: OSMSourceObject | BingSourceObject | TiffSourceObject;
}

////////////////////////////////////////////////////////////////////////////

//////////// Image layer
interface StaticSourceObject {
  type: 'Static';
  url: IScript;
  projection: {
    code: string;
    units: string;
    extent: ExtentLikeObject;
  };
  imageExtent: ExtentLikeObject;
  imageSize: PointLikeObject;
}

interface ImageLayerObject {
  type: 'ImageLayer';
  source: StaticSourceObject;
}

////////////////////////////////////////////////////////////////////////////

//////////// Vector layer

interface VectorLayerObject {
  type: 'VectorLayer';
  dataType: 'OSM' | 'GeoJSON';
  source: IScript | string;
  sourceProjection?: string;
}

type LayerSourceObject = VectorLayerObject | ImageLayerObject | TileLayerObject;