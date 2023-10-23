import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { useComponentScript } from '../../Hooks/useComponentScript';

export interface PlayerNumberDisplayProps {
  script: IScript | undefined;
  context: { [name: string]: unknown } | undefined;
}

export default function PlayerNumberDisplay({
  script,
  context,
}: PlayerNumberDisplayProps) {
  const { instance, notFound } = useComponentScript<INumberDescriptor>(
    script,
    context,
  );

  if (notFound) {
    // Add some error handling
    throw Error('NumberDescriptor not found');
  } else {
    return <>{instance!.getValue()}</>;
  }
}
