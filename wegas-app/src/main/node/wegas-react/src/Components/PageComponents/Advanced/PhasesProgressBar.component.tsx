import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { wwarn } from '../../../Helper/wegaslog';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PhasesProgressBar } from '../../Outputs/PhasesProgressBar';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PhasesProgressBarProps extends WegasComponentProps {
  /**
   * phase - a script returning a number descriptor containing the current phase
   */
  phase?: IScript;
  /**
   * phaseMin - a script returning a number descriptor containing the value of the first phase
   */
  phaseMin?: IScript;
  /**
   * phaseMax - a script returning a number descriptor containing the value of the last phase
   */
  phaseMax?: IScript;
}

export default function PlayerPhasesProgressBar({
  phase,
  context,
  phaseMin,
  phaseMax,
  options,
  pageId,
  path,
}: PhasesProgressBarProps) {
  const {
    content: phaseContent,
    instance: phaseInstance,
    notFound: phaseNotFound,
  } = useComponentScript<INumberDescriptor>(phase, context);
  const {
    content: phaseMinContent,
    instance: phaseMinInstance,
    notFound: phaseMinNotFound,
  } = useComponentScript<INumberDescriptor>(phaseMin, context);

  const {
    content: phaseMaxContent,
    instance: phaseMaxInstance,
    notFound: phaseMaxNotFound,
  } = useComponentScript<INumberDescriptor>(phaseMax, context);

  if (phaseNotFound) {
    wwarn(`Current phase not found: ${phaseContent}`);
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else if (phaseMinNotFound) {
    wwarn(`Phase min not found: ${phaseMinContent}`);
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else if (phaseMaxNotFound) {
    wwarn(`Phase max not found: ${phaseMaxContent}`);
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else {
    return (
      <PhasesProgressBar
        value={phaseInstance!.getValue()}
        phaseMin={phaseMinInstance!.getValue()}
        phaseMax={phaseMaxInstance!.getValue()}
        disabled={options.disabled || options.locked}
      />
    );
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerPhasesProgressBar,
    componentType: 'Advanced',
    name: 'Phases',
    icon: 'ellipsis-h',
    illustration: 'phases',
    schema: {
      phase: schemaProps.scriptVariable({
        label: 'Phase',
        required: true,
        returnType: ['SNumberDescriptor'],
      }),
      phaseMin: schemaProps.scriptVariable({
        label: 'Phase min',
        required: true,
        returnType: ['SNumberDescriptor'],
      }),
      phaseMax: schemaProps.scriptVariable({
        label: 'Phase max',
        required: true,
        returnType: ['SNumberDescriptor'],
      }),
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      phase: createFindVariableScript(v),
    }),
  }),
);
