import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { NumberBox } from '../../Inputs/Number/NumberBox';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerBoxesProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * hideBoxValue - number each individual box
   */
  numberedBoxes?: boolean;
}

function PlayerBoxes({
  script,
  context,
  numberedBoxes,
  className,
  style,
  id,
  options,
  pageId,
  path,
}: PlayerBoxesProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const { descriptor, instance, notFound } =
    useComponentScript<INumberDescriptor>(script, context);

  return notFound ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Number')}
      pageId={pageId}
      path={path}
    />
  ) : (
    <NumberBox
      className={className}
      style={style}
      id={id}
      value={instance?.getValue()}
      minValue={
        descriptor?.getMinValue() != null
          ? (descriptor.getMinValue() as number)
          : undefined
      }
      maxValue={
        descriptor?.getMaxValue() != null
          ? (descriptor.getMaxValue() as number)
          : undefined
      }
      numberedBoxes={numberedBoxes}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerBoxes,
    componentType: 'Output',
    id: 'Boxes',
    name: 'Boxes',
    icon: 'ellipsis-h',
    illustration: 'boxes',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: false,
        returnType: ['SNumberDescriptor'],
      }),
        numberedBoxes: schemaProps.boolean({ label: 'Number boxes' }),
      ...classStyleIdSchema,
    },
    allowedVariables: ['NumberDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
