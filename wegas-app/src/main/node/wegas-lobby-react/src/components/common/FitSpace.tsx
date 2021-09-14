/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import * as React from 'react';
import Flex, { FlexProps } from './Flex';

export default function FitSpace(props: Omit<FlexProps, 'grow' | 'shrink'>): JSX.Element {
  return <Flex {...props} grow={1} shrink={1} />;
}
