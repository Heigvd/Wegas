import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PhasesProgressBar } from '../../Outputs/PhasesProgressBar';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, INumberDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

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
  phaseMin,
  phaseMax,
}: PhasesProgressBarProps) {
  const {
    content: phaseContent,
    instance: phaseInstance,
    notFound: phaseNotFound,
  } = useComponentScript<INumberDescriptor>(phase);
  const {
    content: phaseMinContent,
    instance: phaseMinInstance,
    notFound: phaseMinNotFound,
  } = useComponentScript<INumberDescriptor>(phaseMin);

  const {
    content: phaseMaxContent,
    instance: phaseMaxInstance,
    notFound: phaseMaxNotFound,
  } = useComponentScript<INumberDescriptor>(phaseMax);

  return phaseNotFound ? (
    <pre>Current phase not found: {phaseContent}</pre>
  ) : phaseMinNotFound ? (
    <pre>Phase min not found: {phaseMinContent}</pre>
  ) : phaseMaxNotFound ? (
    <pre>Phase max not found: {phaseMaxContent}</pre>
  ) : (
    <PhasesProgressBar
      value={phaseInstance!.value}
      phaseMin={phaseMinInstance!.value}
      phaseMax={phaseMaxInstance!.value}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerPhasesProgressBar,
    componentType: 'Advanced',
    name: 'Phases',
    icon: 'ellipsis-h',
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
