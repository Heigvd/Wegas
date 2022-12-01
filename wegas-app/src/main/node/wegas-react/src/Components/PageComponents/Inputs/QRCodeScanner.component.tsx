import * as React from 'react';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { createScriptCallback, ScriptCallback, useScriptCallback } from '../../Hooks/useScript';
import QRCodeScanner from '../../Inputs/QRCode/QRCodeScanner';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerQrCodeScannerProps
  extends WegasComponentProps {
  /**
   * onScan
   */
  onScan: ScriptCallback;
}

function PlayerQrCodeScanner({
  className,
  style,
  id,
  onScan,
  pageId,
  path,
  context,
}: PlayerQrCodeScannerProps): JSX.Element {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);

  const contextRef = React.useRef(context);
  contextRef.current = context;

  const callback = useScriptCallback<(data: string) => void>(onScan, contextRef);
  if (callback == null){
    return (<UncompleteCompMessage
      message={somethingIsUndefined('String')}
      pageId={pageId}
      path={path}
    />);
  }
  return (<div
    className={ className } style={ style } id={ id }>
    <QRCodeScanner onScan={ callback } />
  </div>);
}

registerComponent(
  pageComponentFactory({
    component: PlayerQrCodeScanner,
    componentType: 'Input',
    id: 'qrScanner',
    name: 'QR code scanner',
    icon: 'qrcode',
    illustration: 'qrScanner',
    schema: {
      onScan: schemaProps.callback({
        label: 'on scan',
        callbackProps: {
          args: [
            ["data", ['string']],
          ],
          returnType: ['void'],
        }
      }),
      ...classStyleIdShema,
    },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({
      onScan: createScriptCallback("", ["data"]),
    }),
  }),
);
