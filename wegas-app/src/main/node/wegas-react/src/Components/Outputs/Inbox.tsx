import { cx } from '@emotion/css';
import * as React from 'react';
import { IInboxDescriptor, IMessage } from 'wegas-ts-api';
import {
  flex,
  itemCenter,
  unreadSignalStyle,
  unreadSpaceStyle,
} from '../../css/classes';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../data/selectors';
import { store, useStore } from '../../data/Stores/store';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import {
  DefaultEntityChooserLabel,
  EntityChooser,
  EntityChooserLabelProps,
} from '../EntityChooser';
import { TranslatableText } from './HTMLText';

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

function MessageChooser(props: EntityChooserLabelProps<IMessage>) {
  return (
    <DefaultEntityChooserLabel {...props}>
      <MessageLabel message={props.entity} />
    </DefaultEntityChooserLabel>
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
      EntityLabel={MessageChooser}
      disabled={disabled}
      readOnly={readOnly}
    >
      {MessageDisplay}
    </EntityChooser>
  );
}
