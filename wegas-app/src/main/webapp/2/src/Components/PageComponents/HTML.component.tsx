import * as React from 'react';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';

const HTML: React.FunctionComponent<{ text: string }> = ({
  text,
}: {
  text: string;
}) => {
  return (
    <div
      style={{ display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

registerComponent(
  pageComponentFactory(
    HTML,
    'HTML',
    'file-code',
    {
      text: schemaProps.string('Value'),
    },
    [],
    () => ({
      text: '',
    }),
  ),
);
