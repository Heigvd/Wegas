import {
  Attribution,
  Control,
  FullScreen,
  MousePosition,
  OverviewMap,
  Rotate,
  ScaleLine,
  Zoom,
  ZoomSlider,
  ZoomToExtent,
} from 'ol/control';
import { ViewOptions } from 'ol/View';
import * as React from 'react';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import {
  ScriptCallback,
  useScriptObjectWithFallback,
  useUpdatedContextRef,
} from '../../Hooks/useScript';
import {
  mapOptionsSchema,
  viewOptionsSchema,
} from '../../Maps/helpers/schemas/MapSchemas';
import { WegasMap, WegasMapOptions } from '../../Maps/WegasMap';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

function isOlControl(control: Control | undefined): control is Control {
  return control != null;
}

function wegasControlsToOlControls(
  controls: MapControls[] | undefined,
): Control[] | undefined {
  if (controls == null) {
    return undefined;
  } else {
    return controls
      .map(controlType => {
        switch (controlType) {
          case 'attribution':
            return new Attribution();
          case 'fullscreen':
            return new FullScreen();
          case 'mousePosition':
            return new MousePosition();
          case 'overviewMap':
            return new OverviewMap();
          case 'rotate':
            return new Rotate();
          case 'scaleLine':
            return new ScaleLine();
          case 'zoomSlider':
            return new ZoomSlider();
          case 'zoomToExtent':
            return new ZoomToExtent();
          case 'zoom':
            return new Zoom();
        }
      })
      .filter(isOlControl) as Control[];
  }
}

const defaultViewOptions: ViewOptions = {
  projection: 'EPSG:3857',
  zoom: 15,
  center: [775277, 5831039],
};

interface PayerMapOptions
  extends Omit<WegasMapOptions, 'controls' | 'onClick'> {
  controls: MapControls[];
  onClick?: ScriptCallback;
}

interface PlayerMapProps extends WegasComponentProps {
  mapOptions?: {
    [P in keyof PayerMapOptions]: PayerMapOptions[P] | IScript;
  };
  viewOptions?: {
    [P in keyof ViewOptions]: ViewOptions[P] | IScript;
  };
  debug?: boolean;
  OSMLayer?: boolean;
}

const defaultControls: MapControls[] = [];
const defaultMapOptions: PayerMapOptions = { controls: defaultControls };

export default function PlayerMap({
  children,
  mapOptions: mapProps,
  viewOptions: viewProps,
  debug,
  OSMLayer,
  context,
}: PlayerMapProps) {
  const contextRef = useUpdatedContextRef(context);

  const { mapOptions, viewOptions } = useDeepMemo({
    mapOptions: { ...defaultMapOptions, ...mapProps },
    viewOptions: { ...defaultViewOptions, ...viewProps },
  });
  const currentMapOptions = useScriptObjectWithFallback(mapOptions, contextRef);
  const currentViewOptions = useScriptObjectWithFallback(
    viewOptions,
    contextRef,
  );
  const computedMapOptions = useDeepMemo({
    ...currentMapOptions,
    controls: wegasControlsToOlControls(currentMapOptions.controls),
  });

  return (
    <WegasMap
      mapOptions={computedMapOptions}
      viewOptions={currentViewOptions}
      debug={debug}
      OSMLayer={OSMLayer}
    >
      {children}
    </WegasMap>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerMap,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer: childrenDeserializerFactory(),
    },
    id: 'WegasMap',
    name: 'Map',
    icon: 'map',
    illustration: 'map',
    schema: {
      mapOptions: mapOptionsSchema,
      viewOptions: viewOptionsSchema,
      debug: schemaProps.boolean({ label: 'Debug mode' }),
      OSMLayer: schemaProps.boolean({ label: 'Insert OSM layer' }),
    },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      filterChildrenName: [
        'WegasMapTileLayer',
        'WegasMapOverlay',
        'WegasMapOverlays',
        'WegasMapImageLayer',
        'WegasMapVectorLayer',
        'WegasMapSelect',
      ],
    },
  }),
);
