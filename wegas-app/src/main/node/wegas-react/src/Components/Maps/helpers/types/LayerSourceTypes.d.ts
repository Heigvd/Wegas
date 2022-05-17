//////////// Tile layer
interface TiffSourceObject {
  type: 'Tiff';
  normalize?: boolean;
  sources: { url: IScript }[];
}

interface TileLayerSourceObject {
  type: 'TileLayer';
  source: TiffSourceObject;
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

interface ImageLayerSourceObject {
  type: 'ImageLayer';
  source: StaticSourceObject;
}

////////////////////////////////////////////////////////////////////////////

//////////// Vector layer

interface VectorLayerSourceObject {
  type: 'VectorLayer';
  dataType: 'OSM' | 'GeoJSON';
  source: IScript | string;
  sourceProjection?: string;
}

type LayerSourceObject =
  | VectorLayerSourceObject
  | ImageLayerSourceObject
  | TileLayerSourceObject;

interface VectorLayerProps {
  className?: string;
  opacity?: number;
  visible?: boolean;
  extent?: PointLikeObject;
  zIndex?: number;
  minResolution?: number;
  maxResolution?: number;
  minZoom?: number;
  maxZoom?: number;
  renderOrder?: (featureA: any, featureB: any) => number;
  renderBuffer?: number;
  declutter?: boolean;
  background?: string;
  updateWhileAnimating?: boolean;
  updateWhileInteracting?: boolean;
}
