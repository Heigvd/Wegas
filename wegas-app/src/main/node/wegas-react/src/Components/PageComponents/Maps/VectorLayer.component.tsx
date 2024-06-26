import GeoJSON from 'ol/format/GeoJSON';
import { Options } from 'ol/layer/BaseVector';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import osmtogeojson from 'osmtogeojson';
import * as React from 'react';
import { useAsync } from 'react-async-hook';
import { fileURL } from '../../../API/files.api';
import { entityIs } from '../../../data/entities';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import {
  ScriptCallback,
  useScript,
  useScriptCallback,
  useScriptObjectWithFallback,
  useUpdatedContextRef,
} from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { styleSourceToOlStyle } from '../../Maps/helpers/LayerStyleHelpers';
import { initializeProjection } from '../../Maps/helpers/proj4js';
import {
  onLayerReadySchema,
  wegasVectorLayerPropsSchema,
  wegasVectorLayerSourceSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { styleObjectSchema } from '../../Maps/helpers/schemas/StyleSchemas';
import { OnLayerReadyFN, WegasLayer } from '../../Maps/WegasLayer';
import { mapCTX } from '../../Maps/WegasMap';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

async function fetchSource(
  pathOrData: string | object | undefined,
): Promise<object | undefined> {
  if (typeof pathOrData === 'string') {
    return (await fetch(fileURL(pathOrData))).json();
  }
  return undefined;
}

interface PlayerVectorLayerProps extends WegasComponentProps {
  layerProps?: IScript | Omit<Options<VectorSource>, 'source' | 'style'>;
  layerSource?: VectorLayerSourceObject;
  layerId?: string;
  layerStyle?: ScriptCallback | StyleObject;
  onLayerReady?: ScriptCallback;
}

export default function PlayerVectorLayer({
  layerProps,
  layerId,
  layerSource,
  layerStyle,
  onLayerReady,
  context,
  pageId,
  path,
}: PlayerVectorLayerProps) {
  const contextRef = useUpdatedContextRef(context);
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);

  const { projection, map } = React.useContext(mapCTX);

  const onLayerReadyFn = useScriptCallback<OnLayerReadyFN>(
    onLayerReady,
    contextRef,
  );

  const scriptableProps = useDeepMemo({
    onLayerReady,
    currentLayerStyle: layerStyle,
    currentLayerProps: layerProps,
  });
  const computedProps = useScriptObjectWithFallback(
    scriptableProps,
    contextRef,
  );
  const { currentLayerProps, currentLayerStyle } = computedProps;

  const source = layerSource?.source;

  let pathOrData: string | object | undefined = useScript<object | string>(
    entityIs(source, 'Script') ? source : undefined,
    context,
  );
  if (!entityIs(source, 'Script')) {
    pathOrData = source;
  }
  const asyncData = useAsync(fetchSource, [pathOrData]);

  const currentOLLayer = React.useMemo(() => {
    let data: object | undefined = undefined;
    if (asyncData.result != null) {
      data = asyncData.result;
    } else if (typeof pathOrData === 'object') {
      data = pathOrData;
    }

    const parsedData =
      data != null && layerSource?.dataType === 'OSM'
        ? osmtogeojson(data, {
            flatProperties: false,
            deduplicator: undefined,
            polygonFeatures: undefined,
            uninterestingTags: undefined,
            verbose: false,
          })
        : data;

    let vectorSource: VectorSource | undefined = undefined;
    if (data != null && layerSource != null) {
      if (layerSource.sourceProjection) {
        initializeProjection(layerSource.sourceProjection);
      }
      vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(parsedData, {
          dataProjection: layerSource.sourceProjection,
          featureProjection: projection,
        }),
        useSpatialIndex: layerSource.useSpatialIndex,
      });
    }

    if (vectorSource != null) {
      return new VectorLayer({
        source: vectorSource,
        style: styleSourceToOlStyle(currentLayerStyle),
        ...currentLayerProps,
        properties: {
          layerId: layerId,
        },
      });
    }
    return null;
  }, [
    asyncData.result,
    currentLayerProps,
    currentLayerStyle,
    layerId,
    layerSource,
    pathOrData,
    projection,
  ]);

  React.useEffect(() => {
    if (onLayerReadyFn != null && currentOLLayer != null && map) {
      onLayerReadyFn(currentOLLayer, map);
    }
  }, [currentOLLayer, map, onLayerReadyFn, projection]);

  if (asyncData.loading) {
    return <TumbleLoader />;
  } else if (asyncData.error) {
    return <pre>{asyncData.error.message}</pre>;
  } else if (currentOLLayer == null) {
    return (
      <UncompleteCompMessage
        message={somethingIsUndefined('source layer')}
        pageId={pageId}
        path={path}
      />
    );
  } else {
    return <WegasLayer layer={currentOLLayer} />;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerVectorLayer,
    componentType: 'Maps',
    id: 'WegasMapVectorLayer',
    name: 'Vector layer',
    icon: 'map',
    illustration: 'vectorLayer',
    schema: {
      layerProps: wegasVectorLayerPropsSchema,
      layerSource: wegasVectorLayerSourceSchema,
      layerStyle: styleObjectSchema,
      layerId: schemaProps.string({ value: '', label: 'Layer id' }),
      onLayerReady: onLayerReadySchema,
    },
  }),
);
