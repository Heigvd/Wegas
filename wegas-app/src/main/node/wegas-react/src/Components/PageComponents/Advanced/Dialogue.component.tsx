import * as React from 'react';
import { IDialogueDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { TumbleLoader } from '../../Loader';
import { DialogueDisplay } from '../../Outputs/Dialogue/Dialogue';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PlayerDialogueProps extends WegasComponentProps {
  dialogue?: IScript;
}

export default function PlayerDialogue({
  dialogue,
  options,
}: PlayerDialogueProps) {
  const { descriptor } = useComponentScript<IDialogueDescriptor>(dialogue);
  if (descriptor === undefined) {
    return <TumbleLoader />;
  }

  return (
    <DialogueDisplay
      dialogue={descriptor}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerDialogue,
    componentType: 'Advanced',
    name: 'Dialogue',
    icon: 'comments',
    illustration: 'dialogue',
    schema: {
      dialogue: schemaProps.scriptVariable({
        label: 'Dialogue',
        required: true,
        returnType: ['SDialogueDescriptor'],
      }),
    },
    allowedVariables: ['DialogueDescriptor'],
    getComputedPropsFromVariable: v => ({
      dialogue: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
