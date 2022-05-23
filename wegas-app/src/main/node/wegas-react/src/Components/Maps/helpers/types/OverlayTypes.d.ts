interface OverlayProps {
  position: PointLikeObject;
  overlayId?: string;
  overlayClassName?: string;
  offset?: PointLikeObject;
  positioning?: PositioningOptions;
  stopEvent?: boolean;
  insertFirst?: boolean;
  autoPan?: AutoPanOptions;
  featuresFilter?: FeatureFilter;
}

interface OverlayItem {
  overlayProps: OverlayProps;
  [key: string]: unknown;
}
