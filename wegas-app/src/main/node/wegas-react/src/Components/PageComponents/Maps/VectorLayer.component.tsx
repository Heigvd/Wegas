import GeoJSON from 'ol/format/GeoJSON';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import osmtogeojson from 'osmtogeojson';
import * as React from 'react';
import { useAsync } from 'react-async-hook';
import { fileURL } from '../../../API/files.api';
import { entityIs } from '../../../data/entities';
import { useScript, useScriptObjectWithFallback } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { styleSourceToOlStyle } from '../../Maps/helpers/LayerStyleHelpers';
import {
  onLayerReadySchema,
  wegasVectorLayerSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { styleObjectSchema } from '../../Maps/helpers/schemas/StyleSchemas';
import { WegasLayer } from '../../Maps/WegasLayer';
import { mapCTX } from '../../Maps/WegasMap';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

async function fetchSource(
  pathOrData: string | object | undefined,
): Promise<object | undefined> {
  if (typeof pathOrData === 'string') {
    return (await fetch(fileURL(pathOrData))).json();
  }
  return undefined;
}

type OnLayerReadyFN = ((layer: BaseLayer) => void) | undefined;

interface PlayerVectorLayerProps extends WegasComponentProps {
  layerSource?: VectorLayerObject;
  layerStyle?: IScript | LayerStyleObject;
  onLayerReady?: IScript;
}

export default function PlayerVectorLayer({
  layerSource,
  layerStyle,
  onLayerReady,
  context,
  pageId,
  path,
}: PlayerVectorLayerProps) {
  const { projection } = React.useContext(mapCTX);

  const onLayerReadyFn = useScript<OnLayerReadyFN>(onLayerReady);
  const currentLayerProps = useScriptObjectWithFallback({ layerStyle });

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
      vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(parsedData, {
          dataProjection: layerSource.sourceProjection,
          featureProjection: projection,
        }),
      });
    }

    if (vectorSource != null) {
      return new VectorLayer({
        source: vectorSource,
        style: styleSourceToOlStyle(currentLayerProps.layerStyle),
      });
    }
    return null;
  }, [
    asyncData.result,
    currentLayerProps.layerStyle,
    layerSource,
    pathOrData,
    projection,
  ]);

  React.useEffect(() => {
    if (onLayerReadyFn != null && currentOLLayer != null) {
      onLayerReadyFn(currentOLLayer);
    }
  }, [currentOLLayer, onLayerReadyFn]);

  if (asyncData.loading) {
    return <TumbleLoader />;
  } else if (asyncData.error) {
    return <pre>{asyncData.error.message}</pre>;
  } else if (currentOLLayer == null) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else {
    return <WegasLayer layer={currentOLLayer} />;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerVectorLayer,
    componentType: 'Maps',
    name: 'WegasMapVectorLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasVectorLayerSchema,
      layerStyle: styleObjectSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);
