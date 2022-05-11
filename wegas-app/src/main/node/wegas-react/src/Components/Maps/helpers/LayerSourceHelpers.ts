import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Projection, ProjectionLike } from 'ol/proj';
import BingMaps from 'ol/source/BingMaps';
import GeoTIFF from 'ol/source/GeoTIFF';
import ImageStatic from 'ol/source/ImageStatic';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import osmtogeojson from 'osmtogeojson';
import { fileURL } from '../../../API/files.api';
import { entityIs } from '../../../data/entities';
import { PagesContextState } from '../../../data/Stores/pageContextStore';
import { safeClientScriptEval } from '../../Hooks/useScript';
import { initializeProjection } from './proj4js';

export function imageObjectToSource(
  source: ImageLayerObject,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
): ImageStatic {
  initializeProjection(source.source.projection.code);
  return new ImageStatic({
    ...source.source,
    projection: new Projection(source.source.projection),
    url: fileURL(
      safeClientScriptEval(
        source.source.url,
        context,
        undefined,
        state,
        undefined,
      ),
    ),
  });
}

export function tileLayerObjectToSource(
  source: TileLayerObject,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
): BingMaps | OSM | GeoTIFF {
  switch (source.source.type) {
    case 'Bing':
      return new BingMaps(source.source);
    case 'OSM':
      return new OSM();
    case 'Tiff': {
      const sources = source.source.sources.map(source => {
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
      return new GeoTIFF(newSource);
    }
    default:
      throw Error(
        `Unknown tile layer source type : ${JSON.stringify(source.source)}`,
      );
  }
}

export async function vectorLayerObjectToSource(
  source: VectorLayerObject,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
  mapProjection: ProjectionLike,
): Promise<VectorSource<Geometry>> {
  let pathOrData: string | object;
  if (entityIs(source.source, 'Script')) {
    pathOrData = safeClientScriptEval<object | string>(
      source.source,
      context,
      undefined,
      state,
      undefined,
    );
  } else {
    pathOrData = source.source;
  }

  if (typeof pathOrData === 'string') {
    pathOrData = await fetch(fileURL(pathOrData)).then(res => res.json());
  }

  switch (source.dataType) {
    case 'GeoJSON':
      return new VectorSource({
        features: new GeoJSON().readFeatures(pathOrData, {
          dataProjection: source.sourceProjection,
          featureProjection: mapProjection,
        }),
      });
    case 'OSM':
      return new VectorSource({
        features: new GeoJSON().readFeatures(
          osmtogeojson(pathOrData, {
            flatProperties: false,
            deduplicator: undefined,
            polygonFeatures: undefined,
            uninterestingTags: undefined,
            verbose: false,
          }),
          {
            dataProjection: source.sourceProjection,
            featureProjection: mapProjection,
          },
        ),
      });
    default:
      throw Error(
        `Unknown vector layer source type : ${JSON.stringify(source.source)}`,
      );
  }
}
