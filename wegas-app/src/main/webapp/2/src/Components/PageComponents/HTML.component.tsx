import * as React from 'react';
import { pageComponentFactory, registerComponent } from './componentFactory';

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
      description: 'HTML',
      properties: {
        text: {
          required: false,
          type: 'string',
          view: {
            featureLevel: 'DEFAULT',
            index: 1,
            label: 'HTML',
          },
        },
      },
    },
    [],
    () => ({
      text: '',
    }),
  ),
);
