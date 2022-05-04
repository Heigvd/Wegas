import { FeatureLike } from 'ol/Feature';
import BaseLayer from 'ol/layer/Base';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { ProjectionLike } from 'ol/proj';
import { StyleLike } from 'ol/style/Style';
import { PagesContextState } from '../../../data/Stores/pageContextStore';
import {
  imageObjectToSource,
  tileLayerObjectToSource,
  vectorLayerObjectToSource,
} from './LayerSourceHelpers';
import { styleObjectsToOLStyle } from './LayerStyleHelpers';

export async function layerObjectsToOLLayer(
  source: LayerSourceObject,
  style: StyleObject | undefined,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
  mapProjection: ProjectionLike,
): Promise<BaseLayer> {
  let olStyle: StyleLike | undefined = undefined;
  if (typeof style === 'function') {
    olStyle = (feature: FeatureLike, resolution: number) => {
      return styleObjectsToOLStyle(style(feature, resolution));
    };
  } else {
    olStyle = styleObjectsToOLStyle(style);
  }

  switch (source.type) {
    case 'ImageLayer': {
      return new ImageLayer({
        source: imageObjectToSource(source, context, state),
      });
    }
    case 'TileLayer': {
      return new TileLayer({
        source: tileLayerObjectToSource(source, context, state),
      });
    }
    case 'VectorLayer': {
      return new VectorLayer({
        source: await vectorLayerObjectToSource(
          source,
          context,
          state,
          mapProjection,
        ),
        style: olStyle,
      });
    }
    default:
      throw Error(`Unknown layer type : ${JSON.stringify(source)}`);
  }
}
