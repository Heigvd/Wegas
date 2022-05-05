import * as React from 'react';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import { overlaySchema } from '../../Maps/helpers/schemas/OverlaySchemas';
import { WegasOverlay } from '../../Maps/WegasOverlay';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerOverlayProps extends WegasComponentProps {
  overlayProps: {
    overlayId?: IScript | string;
    overlayClassName?: IScript | string;
    position?: IScript | PointLikeObject;
    offset?: IScript | PointLikeObject;
    positioning?: IScript | PositioningOptions;
    stopEvent?: IScript | boolean;
    insertFirst?: IScript | boolean;
    autoPan?: IScript | AutoPanOptions;
    positionOnClick?: IScript | boolean;
    featuresFilter?: IScript | FeatureFilter;
  };
}

export default function PlayerOverlay({
  children,
  overlayProps,
}: PlayerOverlayProps) {
  const overlayEvaluatedProps = useScriptObjectWithFallback(overlayProps);

  const ChildrenOverlay = React.useMemo(
    () =>
      function () {
        return <>{children}</>;
      },
    [children],
  );

  return (
    <WegasOverlay
      OverlayComponent={ChildrenOverlay}
      {...overlayEvaluatedProps}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerOverlay,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer: childrenDeserializerFactory(),
    },
    name: 'Overlay',
    icon: 'map',
    illustration: 'scatter',
    schema: overlaySchema,
    allowedVariables: ['InboxDescriptor'],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
