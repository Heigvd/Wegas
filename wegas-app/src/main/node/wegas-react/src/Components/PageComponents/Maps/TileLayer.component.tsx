import TileLayer from 'ol/layer/Tile';
import GeoTIFF from 'ol/source/GeoTIFF';
import * as React from 'react';
import { fileURL } from '../../../API/files.api';
import { entityIs } from '../../../data/entities';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import {
  ScriptCallback,
  useScript,
  useScriptCallback,
} from '../../Hooks/useScript';
import {
  onLayerReadySchema,
  wegasTileLayerPropsSchema,
  wegasTileLayerSourceSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { OnLayerReadyFN, WegasLayer } from '../../Maps/WegasLayer';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerTileLayerProps extends WegasComponentProps {
  layerProps?: TileLayerProps | IScript;
  layerSource?: TileLayerSourceObject;
  onLayerReady?: ScriptCallback;
}

export default function PlayerTileLayer({
  layerProps,
  layerSource,
  onLayerReady,
  pageId,
  path,
  context,
}: PlayerTileLayerProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const currentLayerProps =
    useScript<SharedLayerProps>(
      entityIs(layerProps, 'Script') ? layerProps : undefined,
    ) || (layerProps as SharedLayerProps | undefined);
  const onLayerReadyFn = useScriptCallback<OnLayerReadyFN>(
    onLayerReady,
    context,
  );
  const source = layerSource?.source;
  const currentURLs = useScript<string[]>(
    source?.sources.map(source => source.url),
  );

  const currentOLLayer = React.useMemo(() => {
    if (source != null && currentURLs != null) {
      const sources = currentURLs.map(url => {
        return {
          url: fileURL(url),
        };
      });
      return new TileLayer({
        source: new GeoTIFF({ sources }),
        ...currentLayerProps,
      });
    } else {
      return undefined;
    }
  }, [currentLayerProps, currentURLs, source]);

  React.useEffect(() => {
    if (onLayerReadyFn != null && currentOLLayer != null) {
      onLayerReadyFn(currentOLLayer);
    }
  }, [currentOLLayer, onLayerReadyFn]);

  if (currentOLLayer == null) {
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
    component: PlayerTileLayer,
    componentType: 'Maps',
    id: 'WegasMapTileLayer',
    name: 'Tile layer',
    icon: 'map',
    illustration: 'tileLayer',
    schema: {
      layerProps: wegasTileLayerPropsSchema,
      layerSource: wegasTileLayerSourceSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);
