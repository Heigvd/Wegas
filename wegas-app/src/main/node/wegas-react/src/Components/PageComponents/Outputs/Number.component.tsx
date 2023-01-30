import * as React from 'react';
import { IScript, SNumberDescriptor } from 'wegas-ts-api';
import { halfOpacity } from '../../../css/classes';
import { classOrNothing } from '../../../Helper/className';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useScript } from '../../Hooks/useScript';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import PlayerComponentDisplay from '../tools/PlayerComponentDisplay';
import { schemaProps } from '../tools/schemaProps';

export interface PlayerNumberProps extends WegasComponentProps {
  script?: IScript;
}

function PlayerNumber({
  script,
  context,
  className,
  style,
  id,
  options,
  pageId,
  path,
}: PlayerNumberProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);

  const number = useScript<SNumberDescriptor | number>(script, context);

  return number == null ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Number')}
      pageId={pageId}
      path={path}
    />
  ) : (
    <div
      id={id}
      className={
        className +
        classOrNothing(halfOpacity, options.disabled || options.locked)
      }
      style={style}
    >
      {typeof number === 'number' ? (
        number
      ) : (
        <PlayerComponentDisplay script={script} context={context} />
      )}
    </div>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerNumber,
    componentType: 'Output',
    id: 'Number',
    name: 'Number',
    icon: 'calculator',
    illustration: 'number',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SNumberDescriptor', 'number'],
      }),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
