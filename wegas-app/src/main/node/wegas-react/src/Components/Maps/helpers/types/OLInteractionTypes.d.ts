/*** Draw interaction ***/

type DrawMode = "Point" | "LineString" | "Polygon" | "Circle";

interface OpenLayerEvent {
  type : string;
}

interface DrawEvent extends OpenLayerEvent{
  feature: Feature;
}

interface SelectEvent extends OpenLayerEvent{
  selected: Array<Feature>;
}
