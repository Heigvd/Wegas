import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PhasesProgressBar } from '../../Outputs/PhasesProgressBar';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, INumberDescriptor } from 'wegas-ts-api/typings/WegasEntities';

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

function PlayerPhasesProgressBar({
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
  pageComponentFactory(
    PlayerPhasesProgressBar,
    'Advanced',
    'Phases',
    'ellipsis-h',
    {
      phase: schemaProps.scriptVariable('Phase', true, ['SNumberDescriptor']),
      phaseMin: schemaProps.scriptVariable('Phase min', true, [
        'SNumberDescriptor',
      ]),
      phaseMax: schemaProps.scriptVariable('Phase max', true, [
        'SNumberDescriptor',
      ]),
    },
    ['number'],
    () => ({}),
  ),
);
