import { FeatureLike } from 'ol/Feature';
import {
  Circle,
  Fill,
  Icon,
  Image,
  RegularShape,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { StyleLike } from 'ol/style/Style';

function strokeObjectToOLStroke(stroke: StrokeStyleObject | undefined) {
  return stroke != null && Object.keys(stroke).length > 1
    ? new Stroke(stroke)
    : undefined;
}
function fillObjectToOLFill(fill: FillStyleObject | undefined) {
  return fill != null && Object.keys(fill).length > 1
    ? new Fill(fill)
    : undefined;
}

function imageObjectToOLImage(
  image: ImageStyleObject | undefined,
): Image | undefined {
  if (image == null) {
    return undefined;
  } else {
    switch (image.type) {
      case 'CircleStyle':
        return new Circle({
          ...image,
          stroke: strokeObjectToOLStroke(image.stroke),
          fill: fillObjectToOLFill(image.fill),
        });
      case 'IconStyle':
        return new Icon(image);
      case 'RegularShape':
        return new RegularShape({
          ...image,
          stroke: strokeObjectToOLStroke(image.stroke),
          fill: fillObjectToOLFill(image.fill),
        });
    }
  }
}

function styleObjectToOLStyle(style?: LayerStyleObject): Style | undefined {
  if (
    style == null ||
    Object.values(style).filter(v => v != null).length === 0
  ) {
    return undefined;
  } else {
    return new Style({
      geometry: style.geometry,
      fill: fillObjectToOLFill(style.fill),
      image: imageObjectToOLImage(style.image),
      // renderer:style.renderer ? ...
      // hitDetectionRenderer: style.hitDetectionRenderer ? ...
      stroke: strokeObjectToOLStroke(style.stroke),
      text: style.text
        ? new Text({
            ...style.text,
            stroke: strokeObjectToOLStroke(style.text.stroke),
            fill: fillObjectToOLFill(style.text.fill),
            backgroundStroke: strokeObjectToOLStroke(
              style.text.backgroundStroke,
            ),
            backgroundFill: fillObjectToOLFill(style.text.backgroundFill),
          })
        : undefined,
      zIndex: style.zIndex,
    });
  }
}

function styleIsNotUndefined(style: Style | undefined): style is Style {
  return style != null;
}

function styleObjectsToOLStyle(
  style: LayerStyleObject | LayerStyleObject[] | undefined,
): Style | Array<Style> | undefined {
  if (Array.isArray(style)) {
    return style.map(styleObjectToOLStyle).filter(styleIsNotUndefined);
  } else {
    return styleObjectToOLStyle(style);
  }
}

export function styleSourceToOlStyle(style: StyleObject | undefined) {
  let olStyle: StyleLike | undefined = undefined;
  if (typeof style === 'function') {
    olStyle = (feature: FeatureLike, resolution: number) => {
      return styleObjectsToOLStyle(style(feature, resolution));
    };
  } else {
    olStyle = styleObjectsToOLStyle(style);
  }
  return olStyle;
}
