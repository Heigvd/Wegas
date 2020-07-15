import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { InboxDisplay } from '../../Outputs/Inbox';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, IInboxDescriptor } from 'wegas-ts-api/typings/WegasEntities';

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
}

function PlayerInbox({ inbox }: PlayerInboxProps) {
  const { descriptor } = useComponentScript<IInboxDescriptor>(inbox);
  if (descriptor === undefined) {
    return <pre>No selected list</pre>;
  }

  return <InboxDisplay inbox={descriptor.getEntity()} />;
}

registerComponent(
  pageComponentFactory(
    PlayerInbox,
    'Advanced',
    'Inbox',
    'envelope',
    {
      inbox: schemaProps.scriptVariable('Mailbox', true, ['SInboxDescriptor']),
    },
    ['string'],
    () => ({
      style: {
        overflow: 'auto',
      },
    }),
  ),
);
