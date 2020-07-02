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
import { Text } from './Text';
import { IMessage } from 'wegas-ts-api/typings/WegasEntities';
import { ISMessage, ISInboxDescriptor } from 'wegas-ts-api/typings/WegasScriptableEntities';

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
  entity: ISMessage;
}

function MessageDisplay({ entity }: MessageDisplayProps) {
  const date = useTranslate(entity.date);
  const from = useTranslate(entity.from);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>{date}</div>
      <div>{from}</div>
      <Text htmlTranslatableContent={entity.body} />
    </div>
  );
}

interface InboxDisplayProps {
  inbox: ISInboxDescriptor;
}

export function InboxDisplay({ inbox }: InboxDisplayProps) {
  const messages = useStore(() => {
    return inbox.getInstance(Player.selectCurrent()).messages;
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
