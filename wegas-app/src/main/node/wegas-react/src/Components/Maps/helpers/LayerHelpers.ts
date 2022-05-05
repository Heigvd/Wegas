import BaseLayer from 'ol/layer/Base';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { ProjectionLike } from 'ol/proj';
import { PagesContextState } from '../../../data/Stores/pageContextStore';
import {
  imageObjectToSource,
  tileLayerObjectToSource,
  vectorLayerObjectToSource,
} from './LayerSourceHelpers';
import { styleSourceToOlStyle } from './LayerStyleHelpers';

export async function layerObjectsToOLLayer(
  source: LayerSourceObject,
  style: StyleObject | undefined,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
  mapProjection: ProjectionLike,
): Promise<BaseLayer> {
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
        style: styleSourceToOlStyle(style),
      });
    }
    default:
      throw Error(`Unknown layer type : ${JSON.stringify(source)}`);
  }
}
