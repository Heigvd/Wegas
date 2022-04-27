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
  projection?: string;
  imageExtent?: [number, number, number, number];
  imageSize?: [number, number];
}

interface ImageLayerObject {
  type: 'ImageLayer';
  source: StaticSourceObject;
}

////////////////////////////////////////////////////////////////////////////

//////////// Vector layer

interface UrlData {
  type: 'URL';
  url: string;
}
interface JsonData {
  type: 'JSON';
  value: object;
}
type VectorLayerData = UrlData | JsonData;

interface GeoJSONSourceObject {
  type: 'GeoJSON';
  features: VectorLayerData;
}

interface OSMSourceObject {
  type: 'OSM';
  features: VectorLayerData;
}

interface VectorLayerObject {
  type: 'VectorLayer';
  source: GeoJSONSourceObject | OSMSourceObject;
  sourceProjection?: string;
  mapProjection?: string;
}

export type LayerObject =
  | VectorLayerObject
  | ImageLayerObject
  | TileLayerObject;
