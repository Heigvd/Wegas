type ColorStyleObject = string | CanvasPattern | CanvasGradient;

type FeatureGeometryType =
  | 'Point'
  | 'LineString'
  | 'LinearRing'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection'
  | 'Circle';

interface FillStyleObject {
  type: 'FillStyle';
  color: ColorStyleObject;
}

interface StrokeStyleObject {
  type: 'StrokeStyle';
  color?: ColorStyleObject;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
  lineDash?: number[];
  lineDashOffset?: number;
  miterLimit?: number;
  width?: number;
}

interface SharedImageStyleProperties {
  opacity?: number;
  rotateWithView?: boolean;
  rotation?: number;
  scale?: PointLikeObject | number;
  displacement?: PointLikeObject;
}

interface CircleStyleObject extends SharedImageStyleProperties {
  type: 'CircleStyle';
  fill?: FillStyleObject;
  stroke?: StrokeStyleObject;
  radius: number;
}

interface RegularShapeStyleObject
  extends Omit<CircleStyleObject, 'type' | 'radius'> {
  type: 'RegularShape';
  points: number;
  radius?: number;
  radius1?: number;
  radius2?: number;
  angle?: number;
}

type AnchorUnitsStyleObject = 'fraction' | 'pixels';
type AnchorPositionStyleObject =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';
type CrossOriginStyleObject = 'anonymous' | 'use-credentials';

interface IconStyleObject extends SharedImageStyleProperties {
  type: 'IconStyle';
  anchor?: PointLikeObject;
  anchorOrigin?: AnchorPositionStyleObject;
  anchorXUnits?: AnchorUnitsStyleObject;
  anchorYUnits?: AnchorUnitsStyleObject;
  color?: string;
  crossOrigin?: CrossOriginStyleObject;
  img?: HTMLImageElement | HTMLCanvasElement;
  offset?: PointLikeObject;
  offsetOrigin?: PointLikeObject;
  size?: PointLikeObject;
  imgSize?: PointLikeObject;
  src?: string;
}

type ImageStyleObject =
  | CircleStyleObject
  | RegularShapeStyleObject
  | IconStyleObject;

interface TextStyleObject extends Partial<SharedImageStyleProperties> {
  type: 'TextStyle';
  font?: 'string';
  maxAngle?: number;
  offsetX?: number;
  offsetY?: number;
  overflow?: boolean;
  placement?: 'point' | 'line';
  text?: string | string[];
  textAlign?: 'left' | 'right' | 'center' | 'end' | 'start';
  textBaseline?:
    | 'bottom'
    | 'top'
    | 'middle'
    | 'alphabetic'
    | 'hanging'
    | 'ideographic';
  fill?: FillStyleObject;
  stroke?: StrokeStyleObject;
  backgroundFill?: FillStyleObject;
  backgroundStroke?: StrokeStyleObject;
  padding?: ExtentLikeObject;
}

interface LayerStyleObject {
  /**
   * The geometry type of feature on witch to apply the style
   */
  geometry?: FeatureGeometryType;
  /**
   * The fill style to apply to the features layer
   */
  fill?: FillStyleObject;
  /**
   * The image transformation to apply to the image features
   */
  image?: ImageStyleObject;
  /**
   * Custom renderer. When configured, fill, stroke and image will be ignored, and the provided function will be called with each render frame for each geometry.
   */
  renderer?: IScript;
  /**
   * Custom renderer for hit detection. If provided will be used in hit detection rendering.
   */
  hitDetectionRenderer?: IScript;
  /**
   * The stroke style to apply to the features
   */
  stroke?: StrokeStyleObject;
  /**
   * The text style to apply to the features
   */
  text?: TextStyleObject;
  /**
   * The z index of the layer
   */
  zIndex?: number;
}

type RendererFunction = (
  points: PointLikeObject | PointLikeObject[] | PointLikeObject[][],
) => void;

type StyleFunction = (
  feature: any,
  resolution: number,
) => LayerStyleObject | LayerStyleObject[];
type StyleObject = LayerStyleObject | LayerStyleObject[] | StyleFunction;
