import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { InboxDisplay } from '../../Outputs/Inbox';
import { useComponentScript } from '../../Hooks/useComponentScript';

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
}

function PlayerInbox({ inbox }: PlayerInboxProps) {
  const { descriptor } = useComponentScript<ISInboxDescriptor>(inbox);
  if (descriptor === undefined) {
    return <pre>No selected list</pre>;
  }

  return <InboxDisplay inbox={descriptor} />;
}

registerComponent(
  pageComponentFactory(
    PlayerInbox,
    'Inbox',
    'envelope',
    {
      inbox: schemaProps.scriptVariable('Mailbox', true, ['ISInboxDescriptor']),
    },
    ['string'],
    () => ({
      style: {
        overflow: 'auto',
      },
    }),
  ),
);
