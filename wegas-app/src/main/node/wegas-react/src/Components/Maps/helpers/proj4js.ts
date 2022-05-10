/**
 * imported from https://gist.github.com/yuletide/3909348
 */

import { register } from 'ol/proj/proj4';
import Proj4js from 'proj4';

let Proj4jsDefRegistered = false;

if (!Proj4jsDefRegistered) {
  Proj4jsDefRegistered = true;
  import('./epsgDefs.json').then(defs => {
    Object.entries(defs.default).forEach(([k, v]) => Proj4js.defs(k, v));
    register(Proj4js);
  });
}
