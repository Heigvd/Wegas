//Other libs
// React
import { Select } from 'ol/interaction';
import { Options, SelectEvent } from 'ol/interaction/Select';
import * as React from 'react';
import { mapCTX } from './WegasMap';

/**
 * A react implementation of OpenLayer Select object
 * @link https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html
 */
export interface WegasSelectProps extends Options {
  onSelect?: (event: SelectEvent) => void;
}

export function WegasSelect({ onSelect, ...selectOptions }: WegasSelectProps) {
  const { map } = React.useContext(mapCTX);
  React.useEffect(() => {
    if (map) {
      const select = new Select(selectOptions);
      map.addInteraction(select);

      if (onSelect) {
        select.on('select', onSelect);
      }

      return () => {
        map.removeInteraction(select);
      };
    }
  }, [map, onSelect, selectOptions]);

  return null;
}
