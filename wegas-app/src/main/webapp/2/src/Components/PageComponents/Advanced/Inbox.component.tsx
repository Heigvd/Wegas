import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import {
  ConnectedQuestionDisplay,
  ConnectedInboxDisplay,
  MessageDisplay,
} from '../../AutoImport/Question/List';
import { WegasComponentProps } from '../tools/EditableComponent';
import { EntityChooser } from '../../EntityChooser';
import { TranslatableContent } from '../../../data/i18n';
import { cx, css } from 'emotion';
import { flex, itemCenter } from '../../../css/classes';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { safeClientScriptEval } from '../../Hooks/useScript';
import { useStore } from '../../../data/store';
import { shallowDifferent, deepDifferent } from '../../Hooks/storeHookFactory';
import { Player } from '../../../data/selectors';

const unreadSignalStyle = css({ margin: '3px' });

interface PlayerInboxProps extends WegasComponentProps {
  inbox?: IScript;
}

function PlayerInbox({ inbox }: PlayerInboxProps) {
  const entities = useStore(s => {
    const descriptor = safeClientScriptEval<ISInboxDescriptor>(
      inbox ? inbox.content : '',
    );

    if (descriptor == null || descriptor.name == null) {
      return [];
    }
    return descriptor.getInstance(Player.selectCurrent()).messages;
    // return flatten<IQuestionDescriptor>(
    //   descriptor,
    //   'QuestionDescriptor',
    // ).filter(q => {
    //   const instance = getInstance(q);
    //   if (instance != null) {
    //     return instance.active;
    //   }
    //   return false;
    // });
  }, deepDifferent);

  if (inbox === undefined) {
    return <pre>No selected list</pre>;
  }

  return (
    <EntityChooser
      entities={entities}
      entityLabel={e => {
        return (
          <div className={cx(flex, itemCenter)}>
            <div className={flex}>
              {TranslatableContent.toString(e.subject)}
            </div>
            {entities.filter(e => e.unread).length > 0 && (
              <FontAwesome className={unreadSignalStyle} icon="exclamation" />
            )}
          </div>
        );
      }}
    >
      {MessageDisplay}
    </EntityChooser>
  );
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
    () => ({}),
  ),
);
