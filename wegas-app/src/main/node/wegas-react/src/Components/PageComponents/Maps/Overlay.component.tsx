import { Coordinate } from 'ol/coordinate';
import * as React from 'react';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import {
  useScriptObjectWithFallback,
  useUpdatedContextRef,
} from '../../Hooks/useScript';
import { overlaySchema } from '../../Maps/helpers/schemas/OverlaySchemas';
import { WegasOverlay, WegasOverlayProps } from '../../Maps/WegasOverlay';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  DummyContainer,
  PageDeserializer,
} from '../tools/PageDeserializer';

export const defaultOverlayPositionKey = 'OverlayClickPosition';

interface PlayerOverlayContext {
  exposePositionAs: string;
  clickedPosition: Coordinate | undefined;
}

const defaultPlayerOverlayCTX: PlayerOverlayContext = {
  exposePositionAs: defaultOverlayPositionKey,
  clickedPosition: undefined,
};

const playerOverlayCTX = React.createContext<PlayerOverlayContext>(
  defaultPlayerOverlayCTX,
);

type ComputedOverlayProps = Omit<
  WegasOverlayProps,
  'OverlayComponent' | 'onClick'
> & { exposePositionAs?: string };
type ScriptableOverlayProps = {
  [P in keyof ComputedOverlayProps]: ComputedOverlayProps[P] | IScript;
};

interface PlayerOverlayProps extends WegasComponentProps {
  overlayProps?: ScriptableOverlayProps;
}

export default function PlayerOverlay({
  children,
  overlayProps,
  context,
}: PlayerOverlayProps) {
  const contextRef = useUpdatedContextRef(context);
  const [clickedPosition, setClickedPosition] = React.useState<
    undefined | Coordinate
  >(undefined);
  const props = useScriptObjectWithFallback<ScriptableOverlayProps>(
    overlayProps || {},
    contextRef,
  );
  const {
    exposePositionAs = defaultOverlayPositionKey,
    ...overlayEvaluatedProps
  } = props;

  return (
    <playerOverlayCTX.Provider value={{ exposePositionAs, clickedPosition }}>
      <WegasOverlay
        {...overlayEvaluatedProps}
        onPositionChange={setClickedPosition}
      >
        {children}
      </WegasOverlay>
    </playerOverlayCTX.Provider>
  );
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  containerPropsKeys,
  inheritedOptionsState,
}: ChildrenDeserializerProps<UnknownValuesObject>) {
  const { exposePositionAs, clickedPosition } =
    React.useContext(playerOverlayCTX);
  const newContext = useDeepMemo({
    ...context,
    [exposePositionAs]: clickedPosition,
  });
  return (
    <>
      {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer Container={DummyContainer} path={path} />
      ) : (
        wegasChildren?.map((_c, i) => {
          return (
            <PageDeserializer
              key={JSON.stringify([...path, i])}
              pageId={pageId}
              path={[...path, i]}
              uneditable={uneditable}
              context={newContext}
              Container={DummyContainer}
              containerPropsKeys={containerPropsKeys}
              dropzones={{}}
              inheritedOptionsState={inheritedOptionsState}
            />
          );
        })
      )}
    </>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerOverlay,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer,
    },
    id: 'WegasMapOverlay',
    name: 'Overlay',
    icon: 'map',
    illustration: 'overlay',
    schema: overlaySchema,
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
  }),
);
