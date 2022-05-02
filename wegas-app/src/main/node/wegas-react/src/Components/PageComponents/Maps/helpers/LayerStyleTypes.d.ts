type ObjectColor = number | number[] | string | CanvasPattern | CanvasGradient;

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
  color: ObjectColor;
}

interface StrokeStyleObject {
  type: 'StrokeStyle';
  color?: ObjectColor;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bever' | 'round' | 'miter';
  lineDash?: number[];
  lineDashOffset?: number;
  miterLimit?: number;
  width?: number;
}

interface SharedStyleProperties {
  rotateWithView: boolean;
  rotation: number;
  scale: PointLikeObject;
  displacement: PointLikeObject;
}

interface ImageStyleObject extends SharedStyleProperties {
  type: 'ImageStyle';
  opacity: number;
}

interface TextStyleObject extends SharedStyleProperties {
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

interface StyleObject {
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

type StyleFunction = IScript | StyleObject | StyleObject[];
