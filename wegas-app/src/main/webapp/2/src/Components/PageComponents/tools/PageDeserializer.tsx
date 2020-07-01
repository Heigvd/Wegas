import * as React from 'react';
import { ComponentContainer } from './EditableComponent';

interface PageDeserializerProps {
  pageId?: string;
}

export function PageDeserializer({
  pageId,
}: PageDeserializerProps): JSX.Element {
  return <ComponentContainer pageId={pageId} />;
}
