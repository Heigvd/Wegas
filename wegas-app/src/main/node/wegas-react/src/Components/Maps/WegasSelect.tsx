//Other libs
// React
import { Select } from 'ol/interaction';
import Layer from 'ol/layer/Layer';
import LayerRenderer from 'ol/renderer/Layer';
import Source from 'ol/source/Source';
import { Style } from 'ol/style';
import * as React from 'react';
import { wlog } from '../../Helper/wegaslog';
import { mapCTX } from './WegasMap';

export interface WegasOverlayComponentProps {
  inputRef: React.LegacyRef<HTMLElement>;
}

interface WegasSelectProps {
  selectStyle: Style;
  layers?:
    | Layer<Source, LayerRenderer<any>>[]
    | ((arg0: Layer<Source, LayerRenderer<any>>) => boolean);
}

export function WegasSelect({ selectStyle, layers }: WegasSelectProps) {
  const { map } = React.useContext(mapCTX);
  React.useEffect(() => {
    const select = new Select({ style: selectStyle, layers });
    map?.addInteraction(select);

    select.on('select', function (e) {
      wlog(e);
    });

    return () => {
      map?.removeInteraction(select);
    };
  }, [layers, map, selectStyle]);

  return null;
}
