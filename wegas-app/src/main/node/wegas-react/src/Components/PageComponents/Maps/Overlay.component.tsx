import * as React from 'react';
import { WegasOverlay } from '../../Maps/WegasOverlay';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerOverlayProps extends WegasComponentProps {
  position?: IScript;
}

export default function PlayerOverlay({ children }: PlayerOverlayProps) {
  // const { descriptor } = useComponentScript<IInboxDescriptor>(inbox, context);
  // if (descriptor === undefined) {
  //   wwarn(`No descriptor found for inbox ${name}`);
  //   return <UncompleteCompMessage pageId={pageId} path={path} />;
  // }

  // const position = useScript(position)

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
      initialPosition={[6.961834028944175, 46.313121655957694]}
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
