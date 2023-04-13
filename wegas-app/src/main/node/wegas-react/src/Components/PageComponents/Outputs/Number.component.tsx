import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { halfOpacity } from '../../../css/classes';
import { classOrNothing } from '../../../Helper/className';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
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
  const { instance, notFound } = useComponentScript<INumberDescriptor>(
    script,
    context,
  );
  return notFound ? (
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
      {instance?.getValue()}
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
        returnType: ['SNumberDescriptor'],
      }),
      ...classStyleIdSchema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
