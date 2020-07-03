import * as React from 'react';
import { JSONComponentContainer } from './EditableComponent';

interface JSONPageDeserializerProps {
  wegasComponent?: WegasComponent;
}

export function JSONPageDeserializer({
  wegasComponent,
}: JSONPageDeserializerProps): JSX.Element {
  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }

  return <JSONComponentContainer wegasComponent={wegasComponent} />;
}
