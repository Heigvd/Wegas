import { FeatureLike } from 'ol/Feature';
import { Fill, Image, Stroke, Style, Text } from 'ol/style';
import { StyleLike } from 'ol/style/Style';

function strokeObjectToOLStroke(stroke: StrokeStyleObject | undefined) {
  return stroke != null ? new Stroke(stroke) : undefined;
}
function fillObjectToOLFill(fill: FillStyleObject | undefined) {
  return fill != null ? new Fill(fill) : undefined;
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
      image: style.image ? new Image(style.image) : undefined,
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
