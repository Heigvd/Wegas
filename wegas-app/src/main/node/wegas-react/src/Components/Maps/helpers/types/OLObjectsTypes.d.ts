/**
 * [x, y]
 */
type PointLikeObject = [number, number];

type SimpleGeometryLike =
  PointLikeObject
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][]
  | PointLikeObject[][][][]
  | PointLikeObject[][][][][];

/**
 * [minx, miny, maxx, maxy]
 */
type ExtentLikeObject = [number, number, number, number];

/// Map
type MapControls =
  | 'attribution'
  | 'fullscreen'
  | 'mousePosition'
  | 'overviewMap'
  | 'rotate'
  | 'scaleLine'
  | 'zoomSlider'
  | 'zoomToExtent'
  | 'zoom';

/// Overlay
type PositioningOptions =
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center-left'
  | 'center-center'
  | 'center-right'
  | 'top-left'
  | 'top-center'
  | 'top-right';

type AutoPanOptions =
  | boolean
  | {
      animation?: {
        duration?: number;
        easing?:
          | 'easeIn'
          | 'easeOut'
          | 'inAndOut'
          | 'linear'
          | 'upAndDown'
          | ((input: number) => number);
      };
      margin?: number;
    };

type FeatureFilter =
  | {
      filter: (feature: { get: (attr: string) => any }) => boolean;
      allowClick: boolean;
    }
  | true;

///Select
type ConditionFN = (event: any) => boolean;


/// Features simplified typing
interface Feature {
  getId(): number | string | undefined;
  getGeometry(): Geometry | GeometryCollection | undefined;
  getKeys(): Array<string>;
  getProperties(): {
    [x: string]: any;
  };
  getExtent(): ExtentLikeObject
}

interface Geometry {
  getCoordinates(): SimpleGeometryLike
  getType(): Exclude<FeatureGeometryType, 'GeometryCollection'>;
}

interface GeometryCollection {
  getGeometries(): Array<any>;
  getType(): Extract<FeatureGeometryType, 'GeometryCollection'>
}