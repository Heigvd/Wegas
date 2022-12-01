/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import Picto from '../../pictures/picto.svg';

export interface PictoProps {
  className?: string;
}

export default ({ className }: PictoProps): JSX.Element => {
  return <Picto className={className} />;
};
