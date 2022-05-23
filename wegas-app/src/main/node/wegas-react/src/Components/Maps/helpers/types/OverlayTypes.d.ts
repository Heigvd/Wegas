interface OverlayProps {
  position: PointLikeObject;
  id?: string;
  className?: string;
  offset?: PointLikeObject;
  positioning?: PositioningOptions;
  stopEvent?: boolean;
  insertFirst?: boolean;
  autoPan?: AutoPanOptions;
  featuresFilter?: FeatureFilter;
}

interface OverlayItem {
  overlayProps: OverlayProps;
  payload: { [id: string]: unknown };
}
