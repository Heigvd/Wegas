import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { IFileDescriptor } from 'wegas-ts-api';
import { generateAbsolutePath, fileURL } from '../../../API/files.api';

interface SvgLoaderProps extends WegasComponentProps {
  file?: IFileDescriptor;
}

function SvgLoader({ file }: SvgLoaderProps) {
  return <img src={file ? fileURL(generateAbsolutePath(file)) : undefined} />;
}

registerComponent(
  pageComponentFactory({
    component: SvgLoader,
    componentType: 'Other',
    name: 'SvgLoader',
    icon: 'image',
    schema: {
      src: schemaProps.file('Source'),
    },
    getComputedPropsFromVariable: () => ({
      style: {
        width: '50px',
        height: '50px',
      },
    }),
  }),
);
