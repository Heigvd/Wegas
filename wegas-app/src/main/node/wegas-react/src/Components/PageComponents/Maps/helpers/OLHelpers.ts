import GeoJSON from 'ol/format/GeoJSON';
import BaseLayer from 'ol/layer/Base';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import BingMaps from 'ol/source/BingMaps';
import GeoTIFF from 'ol/source/GeoTIFF';
import ImageStatic from 'ol/source/ImageStatic';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import osmtogeojson from 'osmtogeojson';
import { fileURL } from '../../../../API/files.api';
import { PagesContextState } from '../../../../data/Stores/pageContextStore';
import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { safeClientScriptEval } from '../../../Hooks/useScript';
import { schemaProps } from '../../tools/schemaProps';
import { LayerObject } from './LayerTypes';

export const extentSchema: (label?: string) => AvailableSchemas = (
  label = 'Extent',
) => ({
  type: 'array',
  view: {
    type: 'nupple',
    label,
    itemsSchema: {
      left: schemaProps.number({
        required: true,
        label: 'left',
        layout: 'shortInline',
      }),
      bottom: schemaProps.number({
        required: true,
        label: 'bottom',
        layout: 'shortInline',
      }),
      right: schemaProps.number({
        required: true,
        label: 'right',
        layout: 'shortInline',
      }),
      top: schemaProps.number({
        required: true,
        label: 'top',
        layout: 'shortInline',
      }),
    },
  },
});

export const pointSchema: (label?: string) => AvailableSchemas = (
  label = 'Point',
) => ({
  type: 'array',
  view: {
    type: 'nupple',
    label,
    itemsSchema: {
      x: schemaProps.number({
        required: true,
        label: 'x',
        layout: 'shortInline',
      }),
      y: schemaProps.number({
        required: true,
        label: 'y',
        layout: 'shortInline',
      }),
    },
  },
});

export async function layerObjectToOLLayer(
  layer: LayerObject,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
): Promise<BaseLayer> {
  switch (layer.type) {
    case 'ImageLayer': {
      return new ImageLayer({
        source: new ImageStatic({
          ...layer.source,
          url: fileURL(
            safeClientScriptEval(
              layer.source.url,
              context,
              undefined,
              state,
              undefined,
            ),
          ),
        }),
      });
    }
    case 'TileLayer': {
      let source;
      switch (layer.source.type) {
        case 'Bing':
          source = new BingMaps(layer.source);
          break;
        case 'OSM':
          source = new OSM();
          break;
        case 'Tiff': {
          const sources = layer.source.sources.map(source => {
            return {
              url: fileURL(
                safeClientScriptEval(
                  source.url,
                  context,
                  undefined,
                  state,
                  undefined,
                ),
              ),
            };
          });
          const newSource = { sources };
          source = new GeoTIFF(newSource);
          break;
        }
        default:
          throw Error(
            `Unknown tile layer source type : ${JSON.stringify(layer.source)}`,
          );
      }

      return new TileLayer({ source });
    }
    case 'VectorLayer': {
      let source;
      let data;

      switch (layer.source.features.type) {
        case 'JSON':
          data = layer.source.features.value;
          break;
        case 'URL':
          data = (await fetch(layer.source.features.url).then(res =>
            res.json(),
          )) as Promise<object>;
      }

      switch (layer.source.type) {
        case 'GeoJSON':
          source = new VectorSource({
            features: new GeoJSON().readFeatures(data, {
              dataProjection: layer.sourceProjection,
              featureProjection: layer.mapProjection,
            }),
          });
          break;
        case 'OSM':
          source = new VectorSource({
            features: new GeoJSON().readFeatures(
              osmtogeojson(data, {
                flatProperties: false,
                deduplicator: undefined,
                polygonFeatures: undefined,
                uninterestingTags: undefined,
                verbose: false,
              }),
              {
                dataProjection: layer.sourceProjection,
                featureProjection: layer.mapProjection,
              },
            ),
          });
          break;
        default:
          throw Error(
            `Unknown vector layer source type : ${JSON.stringify(
              layer.source,
            )}`,
          );
      }

      return new VectorLayer({
        source,
      });
    }
    default:
      throw Error(`Unknown layer type : ${JSON.stringify(layer)}`);
  }
}
