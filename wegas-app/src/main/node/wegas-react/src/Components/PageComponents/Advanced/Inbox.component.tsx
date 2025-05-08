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
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
  mobileDisplay?: boolean;
}

export default function PlayerInbox({
  inbox,
  mobileDisplay,
  context,
  className,
  style,
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
      mobileDisplay={mobileDisplay}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
      className={className}
      style={style}
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
      mobileDisplay: schemaProps.boolean({
        label: 'Allow display to switch to mobile when needed',
        value: false,
      }),
      ...classStyleIdSchema,
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
