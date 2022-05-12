import TileLayer from 'ol/layer/Tile';
import GeoTIFF from 'ol/source/GeoTIFF';
import * as React from 'react';
import { useScript } from '../../Hooks/useScript';
import {
  onLayerReadySchema,
  wegasTileLayerSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { WegasLayer } from '../../Maps/WegasLayer';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerTileLayerProps extends WegasComponentProps {
  layerSource?: TileLayerObject;
  onLayerReady?: IScript;
}

export default function PlayerTileLayer({
  layerSource,
  onLayerReady,
  pageId,
  path,
}: PlayerTileLayerProps) {
  const onLayerReadyFn = useScript<OnLayerReadyFN>(onLayerReady);
  const source = layerSource?.source;
  const currentURLs = useScript<string[]>(
    source?.sources.map(source => source.url),
  );

  const currentOLLayer = React.useMemo(() => {
    if (source != null && currentURLs != null) {
      const sources = currentURLs.map(url => {
        return {
          url,
        };
      });
      return new TileLayer({ source: new GeoTIFF({ sources }) });
    } else {
      return undefined;
    }
  }, [currentURLs, source]);

  React.useEffect(() => {
    if (onLayerReadyFn != null && currentOLLayer != null) {
      onLayerReadyFn(currentOLLayer);
    }
  }, [currentOLLayer, onLayerReadyFn]);

  if (currentOLLayer == null) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else {
    return <WegasLayer layer={currentOLLayer} />;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerTileLayer,
    componentType: 'Maps',
    name: 'WegasMapImageLayer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasTileLayerSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);
