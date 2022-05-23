import ImageLayer from 'ol/layer/Image';
import { Projection } from 'ol/proj';
import ImageStatic from 'ol/source/ImageStatic';
import * as React from 'react';
import { fileURL } from '../../../API/files.api';
import { entityIs } from '../../../data/entities';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useScript } from '../../Hooks/useScript';
import {
  onLayerReadySchema,
  wegasImageLayerPropsSchema,
  wegasImageLayerSourceSchema,
} from '../../Maps/helpers/schemas/LayerSchemas';
import { WegasLayer } from '../../Maps/WegasLayer';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerImageLayerProps extends WegasComponentProps {
  layerSource?: ImageLayerSourceObject;
  layerProps?: IScript | SharedLayerProps;
  onLayerReady?: IScript;
}

export default function PlayerImageLayer({
  layerSource,
  layerProps,
  onLayerReady,
  pageId,
  path,
}: PlayerImageLayerProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const onLayerReadyFn = useScript<OnLayerReadyFN>(onLayerReady);

  const currentLayerProps =
    useScript<SharedLayerProps>(
      entityIs(layerProps, 'Script') ? layerProps : undefined,
    ) || (layerProps as SharedLayerProps | undefined);
  const source = layerSource?.source;
  const currentURL = useScript<string | undefined>(source?.url);

  const currentOLLayer = React.useMemo(() => {
    if (source != null && currentURL != null) {
      return new ImageLayer({
        source: new ImageStatic({
          ...currentLayerProps,
          ...source,
          projection: new Projection(source.projection),
          url: fileURL(currentURL),
        }),
      });
    } else {
      return undefined;
    }
  }, [currentLayerProps, currentURL, source]);

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
    component: PlayerImageLayer,
    componentType: 'Maps',
    id: 'WegasMapImageLayer',
    name: 'Image layer',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      layerSource: wegasImageLayerSourceSchema,
      layerProps: wegasImageLayerPropsSchema,
      onLayerReady: onLayerReadySchema,
    },
  }),
);
