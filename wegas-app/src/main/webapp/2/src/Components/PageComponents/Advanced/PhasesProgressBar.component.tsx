import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PhasesProgressBar } from '../../Outputs/PhasesProgressBar';
import { schemaProps } from '../tools/schemaProps';

interface PhasesProgressBarProps extends PageComponentMandatoryProps {
  /**
   * phase - a script returning a number descriptor containing the current phase
   */
  phase?: IScript;
  /**
   * phases - a script returning a number descriptor containing the number of phase
   */
  phases?: IScript;
}

function PlayerPhasesProgressBar(props: PhasesProgressBarProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  const {
    content: phaseContent,
    instance: phaseInstance,
    notFound: phaseNotFound,
  } = useComponentScript<INumberDescriptor>(childProps.phase);
  const {
    content: phasesContent,
    instance: phasesInstance,
    notFound: phasesNotFound,
  } = useComponentScript<INumberDescriptor>(childProps.phases);

  return (
    <ComponentContainer flexProps={flexProps}>
      {phaseNotFound ? (
        <pre>Not found: {phaseContent}</pre>
      ) : phasesNotFound ? (
        <pre>Not found: {phasesContent}</pre>
      ) : (
        <PhasesProgressBar
          value={phaseInstance!.value}
          phases={phasesInstance!.value}
        />
      )}
    </ComponentContainer>
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
