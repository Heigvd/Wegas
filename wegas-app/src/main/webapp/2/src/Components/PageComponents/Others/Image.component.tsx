import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { fileURL } from '../../../API/files.api';
import { IScript } from 'wegas-ts-api';
import { useScript } from '../../Hooks/useScript';

interface SvgLoaderProps extends WegasComponentProps {
  script?: IScript;
}

function Image({ script }: SvgLoaderProps) {
  const src = useScript<string>(script?.content);
  return <img src={src ? fileURL(src) : undefined} />;
}

registerComponent(
  pageComponentFactory({
    component: Image,
    componentType: 'Other',
    name: 'Image',
    icon: 'image',
    schema: {
      script: schemaProps.scriptablePath('Source', false, 'FILE', {
        fileType: 'image',
        filterType: 'show',
      }),
    },
  }),
);
