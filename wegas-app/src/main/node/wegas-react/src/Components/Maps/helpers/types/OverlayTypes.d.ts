interface OverlayProps {
  position: PointLikeObject;
  exposePositionAs?: string;
  overlayId?: string;
  overlayClassName?: string;
  offset?: PointLikeObject;
  positioning?: PositioningOptions;
  stopEvent?: boolean;
  insertFirst?: boolean;
  autoPan?: AutoPanOptions;
  featuresFilter?: FeatureFilter;
}
