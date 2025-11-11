import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { addSeparator2 } from './numberSeparator';

export interface PlayerNumberDisplayProps {
  script: IScript | undefined;
  context: { [name: string]: unknown } | undefined;
  //separator?: NumberSeparator;
}

export default function PlayerNumberDisplay({
  script,
  context,
  //separator,
}: PlayerNumberDisplayProps) {
  const { instance, notFound } = useComponentScript<INumberDescriptor>(
    script,
    context,
  );

  if (notFound) {
    // Add some error handling
    throw Error('NumberDescriptor not found');
  } else {
    //return <>{addSeparator(instance!.getValue(), separator)}</>;
    return <>{addSeparator2(instance!.getValue())}</>;
  }
}
