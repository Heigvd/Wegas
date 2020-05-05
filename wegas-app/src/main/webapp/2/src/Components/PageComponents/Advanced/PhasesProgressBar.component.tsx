import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PhasesProgressBar } from '../../Outputs/PhasesProgressBar';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PhasesProgressBarProps extends WegasComponentProps {
  /**
   * phase - a script returning a number descriptor containing the current phase
   */
  phase?: IScript;
  /**
   * phases - a script returning a number descriptor containing the number of phase
   */
  phases?: IScript;
}

function PlayerPhasesProgressBar({ phase, phases }: PhasesProgressBarProps) {
  const {
    content: phaseContent,
    instance: phaseInstance,
    notFound: phaseNotFound,
  } = useComponentScript<INumberDescriptor>(phase);
  const {
    content: phasesContent,
    instance: phasesInstance,
    notFound: phasesNotFound,
  } = useComponentScript<INumberDescriptor>(phases);

  return phaseNotFound ? (
    <pre>Not found: {phaseContent}</pre>
  ) : phasesNotFound ? (
    <pre>Not found: {phasesContent}</pre>
  ) : (
    <PhasesProgressBar
      value={phaseInstance!.value}
      phases={phasesInstance!.value}
    />
  );
}

registerComponent(
  pageComponentFactory(
    PlayerPhasesProgressBar,
    'Phases',
    'ellipsis-h',
    {
      phase: schemaProps.scriptVariable('Phase', true, ['NumberDescriptor']),
      phases: schemaProps.scriptVariable('Phases', true, ['NumberDescriptor']),
    },
    ['number'],
    () => ({}),
  ),
);
