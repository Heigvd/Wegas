interface OpenLayerEvent {
  type : string;
}

/*** Draw interaction ***/
interface DrawEvent extends OpenLayerEvent{
  feature: Feature;
}

/*** Select interaction ***/
interface SelectEvent extends OpenLayerEvent{
  selected: Array<Feature>;
}
