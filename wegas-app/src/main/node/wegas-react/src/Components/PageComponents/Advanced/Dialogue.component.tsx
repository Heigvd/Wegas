import * as React from 'react';
import { IDialogueDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { DialogueDisplay } from '../../Outputs/Dialogue/Dialogue';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
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
  context,
  options,
  pageId,
  path,
}: PlayerDialogueProps) {
  const { descriptor } = useComponentScript<IDialogueDescriptor>(
    dialogue,
    context,
  );
  if (descriptor === undefined) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
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
    id: 'Dialogue',
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
