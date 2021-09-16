import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { Player } from '../../data/selectors';
import { useStore, store } from '../../data/Stores/store';
import { EntityChooser } from '../EntityChooser';
import { cx } from '@emotion/css';
import {
  flex,
  itemCenter,
  unreadSignalStyle,
  unreadSpaceStyle,
} from '../../css/classes';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { TranslatableText } from './HTMLText';
import { IMessage, IInboxDescriptor } from 'wegas-ts-api';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';

interface MessageLabelProps {
  message: IMessage;
  disabled?: boolean;
}

function MessageLabel({ message, disabled }: MessageLabelProps) {
  const translatedLabel = useTranslate(message.subject);
  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => !disabled && store.dispatch(readMessage(message))}
    >
      {message.unread ? (
        <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />
      ) : (
        <div className={cx(unreadSpaceStyle)} />
      )}
      <div className={flex}>{translatedLabel}</div>
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
      <TranslatableText content={entity.body} />
    </div>
  );
}

interface InboxDisplayProps extends DisabledReadonly {
  inbox: IInboxDescriptor;
}

export function InboxDisplay({ inbox, disabled, readOnly }: InboxDisplayProps) {
  const messagesSelector = React.useCallback(
    () => getInstance(inbox, Player.selectCurrent())!.messages,
    [inbox],
  );

  const messages = useStore(messagesSelector);

  return (
    <EntityChooser
      entities={messages}
      entityLabel={e => <MessageLabel message={e} />}
      disabled={disabled}
      readOnly={readOnly}
    >
      {MessageDisplay}
    </EntityChooser>
  );
}
