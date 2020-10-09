import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { InboxDisplay } from '../../Outputs/Inbox';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, IInboxDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
}

export default function PlayerInbox({ inbox }: PlayerInboxProps) {
  const { descriptor } = useComponentScript<IInboxDescriptor>(inbox);
  if (descriptor === undefined) {
    return <pre>No selected list</pre>;
  }

  return <InboxDisplay inbox={descriptor.getEntity()} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerInbox,
    componentType: 'Advanced',
    name: 'Inbox',
    icon: 'envelope',
    schema: {
      inbox: schemaProps.scriptVariable({
        label: 'Mailbox',
        required: true,
        returnType: ['SInboxDescriptor'],
      }),
    },
    allowedVariables: ['InboxDescriptor'],
    getComputedPropsFromVariable: v => ({
      inbox: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
