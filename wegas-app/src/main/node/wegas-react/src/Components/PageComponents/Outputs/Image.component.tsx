import { css } from '@emotion/css';
import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { fileURL } from '../../../API/files.api';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

const initialImageStyle = css({
  maxHeight: '100%',
});
const disabledImageStyle = css({
  opacity: 0.5,
  filter: 'grayscale(50%)',
});

interface SvgLoaderProps extends WegasComponentProps {
  script?: IScript;
}

function Image({
  script,
  context,
  style,
  className,
  id,
  options,
}: SvgLoaderProps) {
  const path = useScript<string>(script, context);
  return (
    <img
      src={fileURL(path || '')}
      style={style}
      id={id}
      className={
        initialImageStyle +
        classNameOrEmpty(className) +
        classOrNothing(disabledImageStyle, options.disabled || options.locked)
      }
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: Image,
    componentType: 'Output',
    id: 'Image',
    name: 'Image',
    icon: 'image',
    illustration: 'image',
    schema: {
      script: schemaProps.scriptPath({
        label: 'Source',
        pickType: 'FILE',
        filter: {
          fileType: 'image',
          filterType: 'show',
        },
      }),
      ...classStyleIdShema,
    },
  }),
);
