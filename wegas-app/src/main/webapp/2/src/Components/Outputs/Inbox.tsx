import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { Player } from '../../data/selectors';
import { useStore, store } from '../../data/store';
import { deepDifferent } from '../Hooks/storeHookFactory';
import { EntityChooser } from '../EntityChooser';
import { cx, css } from 'emotion';
import { flex, itemCenter } from '../../css/classes';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { TranslatableText } from './Text';
import { IMessage, IInboxDescriptor } from 'wegas-ts-api';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';

const unreadSignalStyle = css({ margin: '3px' });

interface MessageLabelProps {
  message: IMessage;
}

function MessageLabel({ message }: MessageLabelProps) {
  const translatedLabel = useTranslate(message.subject);
  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => store.dispatch(readMessage(message))}
    >
      <div className={flex}>{translatedLabel}</div>
      {message.unread && (
        <FontAwesome className={unreadSignalStyle} icon="exclamation" />
      )}
    </div>
  );
}

interface MessageDisplayProps {
  entity: IMessage;
}

function MessageDisplay({ entity }: MessageDisplayProps) {
  const date = useTranslate(entity.date);
  const from = useTranslate(entity.from);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>{date}</div>
      <div>{from}</div>
      <TranslatableText htmlTranslatableContent={entity.body} />
    </div>
  );
}

interface InboxDisplayProps {
  inbox: IInboxDescriptor;
}

export function InboxDisplay({ inbox }: InboxDisplayProps) {
  const messages = useStore(() => {
    return getInstance(inbox, Player.selectCurrent())!.messages;
  }, deepDifferent);

  return (
    <EntityChooser
      entities={messages}
      entityLabel={e => <MessageLabel message={e} />}
    >
      {MessageDisplay}
    </EntityChooser>
  );
}
