import * as React from 'react';
import { IInboxDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { wwarn } from '../../../Helper/wegaslog';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { InboxDisplay } from '../../Outputs/Inbox';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
}

export default function PlayerInbox({
  inbox,
  context,
  name,
  options,
  pageId,
  path,
}: PlayerInboxProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const { descriptor } = useComponentScript<IInboxDescriptor>(inbox, context);
  if (descriptor === undefined) {
    wwarn(`No descriptor found for inbox ${name}`);
    return (
      <UncompleteCompMessage
        message={somethingIsUndefined('Inbox')}
        pageId={pageId}
        path={path}
      />
    );
  }

  return (
    <InboxDisplay
      inbox={descriptor.getEntity()}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerInbox,
    componentType: 'Advanced',
    id: 'Inbox',
    name: 'Inbox',
    icon: 'envelope',
    illustration: 'inbox',
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
