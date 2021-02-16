import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { classStyleIdShema } from '../tools/options';
import { IScript } from 'wegas-ts-api';
import { useScript } from '../../Hooks/useScript';
import { css } from 'emotion';
import { fileURL } from '../../../API/files.api';
import { classNameOrEmpty } from '../../../Helper/className';

const initialImageStyle = css({
  //maxWidth: '100%',
  maxHeight: '100%',
});
const disabledImageStyle = css({
  opacity: 0.5,
  filter: "grayscale(50%)",
});

interface SvgLoaderProps extends WegasComponentProps {
  script?: IScript;
}

function Image({ script, context, style, className, id, options }: SvgLoaderProps) {
  const path = useScript<string>(script, context);
  return (
    <img
      src={fileURL(path || '')}
      style={style}
      id={id}
      className={initialImageStyle + classNameOrEmpty(className) + (options.disabled && disabledImageStyle)}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: Image,
    componentType: 'Output',
    name: 'Image',
    icon: 'image',
    schema: {
      script: schemaProps.path({
        label: 'Source',
        pickType: 'FILE',
        filter: {
          fileType: 'image',
          filterType: 'show',
        },
        scriptable: true,
      }),
      ...classStyleIdShema,
    },
  }),
);
