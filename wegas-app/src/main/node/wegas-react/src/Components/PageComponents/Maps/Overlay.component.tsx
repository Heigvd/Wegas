import { FeatureLike } from 'ol/Feature';
import * as React from 'react';
import { useScriptWithFallback } from '../../Hooks/useScript';
import { WegasOverlay } from '../../Maps/WegasOverlay';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerOverlayProps extends WegasComponentProps {
  position?: IScript | [number, number];
  positionOnClick?: IScript | boolean;
  featuresFilter?:
    | IScript
    | { filter: (feature: FeatureLike) => boolean; allowClick: boolean }
    | true;
}

export default function PlayerOverlay({
  children,
  position: pos,
  positionOnClick: posOnClick,
  featuresFilter: fFilter,
}: PlayerOverlayProps) {
  const position = useScriptWithFallback(pos);
  const positionOnClick = useScriptWithFallback(posOnClick);
  const featuresFilter = useScriptWithFallback(fFilter);

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
      position={position}
      positionOnClick={positionOnClick}
      featuresFilter={featuresFilter}
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
    schema: {},
    allowedVariables: ['InboxDescriptor'],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
