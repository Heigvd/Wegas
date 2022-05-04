type PointLikeObject = [number, number];
type ExtentLikeObject = [number, number, number, number];

type FeatureFilter =
  | {
      filter: (feature: object) => boolean;
      allowClick: boolean;
    }
  | true;
