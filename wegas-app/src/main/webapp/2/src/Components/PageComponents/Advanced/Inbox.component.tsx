import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { InboxDisplay } from '../../Outputs/Inbox';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { ISInboxDescriptor } from 'wegas-ts-api/typings/WegasScriptableEntities';

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
    'Advanced',
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
