import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, IDialogueDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { DialogueDisplay } from '../../Outputs/Dialogue/Dialogue';
import { TumbleLoader } from '../../Loader';

interface PlayerDialogueProps extends WegasComponentProps {
  dialogue?: IScript;
}

export default function PlayerDialogue({ dialogue }: PlayerDialogueProps) {
  const { descriptor } = useComponentScript<IDialogueDescriptor>(dialogue);
  if (descriptor === undefined) {
    return <TumbleLoader />;
  }

  return <DialogueDisplay dialogue={descriptor} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerDialogue,
    componentType: 'Advanced',
    name: 'Dialogue',
    icon: 'comments',
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
