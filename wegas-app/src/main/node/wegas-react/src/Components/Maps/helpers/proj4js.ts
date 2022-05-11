/**
 * imported from https://gist.github.com/yuletide/3909348
 */
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import defs from './epsgDefs.json';

export function initializeProjection(projectionCode: string) {
  const projection = defs[projectionCode as keyof typeof defs];
  if (projection != null) {
    proj4.defs(projectionCode, projection);
    register(proj4);
  }
}
