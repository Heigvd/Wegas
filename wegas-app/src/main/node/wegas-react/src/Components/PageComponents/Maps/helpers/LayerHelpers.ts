import BaseLayer from 'ol/layer/Base';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { ProjectionLike } from 'ol/proj';
import { Stroke, Style } from 'ol/style';
import { PagesContextState } from '../../../../data/Stores/pageContextStore';
import {
  imageObjectToSource,
  tileLayerObjectToSource,
  vectorLayerObjectToSource,
} from './LayerSourceHelpers';

export async function layerObjectToOLLayer(
  layer: LayerObject,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
  mapProjection: ProjectionLike,
): Promise<BaseLayer> {
  switch (layer.type) {
    case 'ImageLayer': {
      return new ImageLayer({
        source: imageObjectToSource(layer, context, state),
      });
    }
    case 'TileLayer': {
      return new TileLayer({
        source: tileLayerObjectToSource(layer, context, state),
      });
    }
    case 'VectorLayer': {
      return new VectorLayer({
        source: await vectorLayerObjectToSource(
          layer,
          context,
          state,
          mapProjection,
        ),
        style: () => {
          return [
            new Style({
              stroke: new Stroke({
                // lineDash
              }),
            }),
          ];
        },
      });
    }
    default:
      throw Error(`Unknown layer type : ${JSON.stringify(layer)}`);
  }
}
