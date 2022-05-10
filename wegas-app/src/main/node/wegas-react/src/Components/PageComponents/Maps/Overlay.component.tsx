import * as React from 'react';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import { overlaySchema } from '../../Maps/helpers/schemas/OverlaySchemas';
import { WegasOverlay, WegasOverlayProps } from '../../Maps/WegasOverlay';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerOverlayProps extends WegasComponentProps {
  overlayProps: {
    [P in keyof Omit<WegasOverlayProps, 'OverlayComponent'>]:
      | WegasOverlayProps[P]
      | IScript;
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
    name: 'WegasMapOverlay',
    icon: 'map',
    illustration: 'scatter',
    schema: overlaySchema,
    allowedVariables: ['InboxDescriptor'],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
