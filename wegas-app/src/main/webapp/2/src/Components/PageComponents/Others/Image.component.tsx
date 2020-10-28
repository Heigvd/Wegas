import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { fileURL } from '../../../API/files.api';
import { classAndStyleShema } from '../tools/options';

interface SvgLoaderProps extends WegasComponentProps {
  src?: string;
}

function Image({ src, style, className }: SvgLoaderProps) {
  return (
    <img
      src={src ? fileURL(src) : undefined}
      style={style}
      className={className}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: Image,
    componentType: 'Other',
    name: 'Image',
    icon: 'image',
    schema: {
      src: schemaProps.path({
        label: 'Source',
        pick: 'FILE',
        filter: {
          fileType: 'image',
          filterType: 'show',
        },
        ...classAndStyleShema,
      }),
    },
  }),
);
