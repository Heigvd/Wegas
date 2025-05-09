import { QRCodeCanvas } from 'qrcode.react';
import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

export interface PlayerQRCodeProps extends WegasComponentProps {
  text?: IScript;
  size?: number;
}

function PlayerQRCode({
  text,
  size,
  context,
  className,
  style,
  id,
}: PlayerQRCodeProps) {
  const content = useScript<string>(text, context);

  // HACK: qrcode.react by the size by `window.devicePixelRatio`
  // we DO NOT WANT such a cranky behaviour
  const eSize = size ? size / window.devicePixelRatio : undefined;

  return (
    <QRCodeCanvas
      id={id}
      className={className}
      style={style}
      value={content || ''}
      size={eSize}
      includeMargin={true}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerQRCode,
    componentType: 'Output',
    id: 'QRCode',
    name: 'QR Code',
    icon: 'qrcode',
    illustration: 'qrCode',
    schema: {
      text: schemaProps.scriptString({ label: 'Text', richText: true }),
      size: {
        view: { label: 'Size', type: 'number' },
        errored: val => {
          if (val < 0) {
            return 'Negative size';
          }
          return '';
        },
      },
      ...classStyleIdSchema,
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      text: createFindVariableScript(v),
    }),
  }),
);
