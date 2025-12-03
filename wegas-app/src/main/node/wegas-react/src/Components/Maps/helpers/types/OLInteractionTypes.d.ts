interface OpenLayerEvent {
  type : string;
}

/*** Draw interaction ***/
interface DrawEvent extends OpenLayerEvent{
  feature: Feature;
}

type DrawType = 'Point' | 'LineString' | 'Polygon' |'Circle';

/*** Select interaction ***/
interface SelectEvent extends OpenLayerEvent{
  selected: Array<Feature>;
}
