import * as React from 'react';
import { JSONComponentContainer } from './EditableComponent';
import { useStore } from '../../../data/store';

interface PageDeserializerProps {
  pageId?: string;
}

export function PageDeserializer({
  pageId,
}: PageDeserializerProps): JSX.Element {
  const wegasComponent = useStore(s => {
    if (!pageId) {
      return undefined;
    }

    return s.pages[pageId];
  });

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }

  return (
    <JSONComponentContainer wegasComponent={wegasComponent} pageId={pageId} />
  );
}
