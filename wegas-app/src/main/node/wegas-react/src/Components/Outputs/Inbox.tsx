import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IInboxDescriptor, IMessage } from 'wegas-ts-api';
import {
  bolder,
  flex,
  itemCenter,
  toolboxHeaderStyle,
  unreadSignalStyle,
  unreadSpaceStyle,
} from '../../css/classes';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../data/selectors';
import { editingStore } from '../../data/Stores/editingStore';
import { useStore } from '../../data/Stores/store';
import { componentsTranslations } from '../../i18n/components/components';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import {
  DefaultEntityChooserLabel,
  EntityChooser,
  EntityChooserLabelProps,
} from '../EntityChooser';
import { useTranslate } from '../Hooks/useTranslate';
import { TranslatableText } from './HTMLText';

interface MessageLabelProps {
  message: IMessage;
  disabled?: boolean;
}

const messageLabel = css({
  maxHeight: 'auto',
  minHeight: '1em',
  maxWidth: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

function MessageLabel({ message, disabled }: MessageLabelProps) {
  const translatedLabel = useTranslate(message.subject);
  return (
    <div
      className={cx(flex, itemCenter, messageLabel)}
      onClick={() => !disabled && editingStore.dispatch(readMessage(message))}
    >
      {message.unread ? (
        <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />
      ) : (
        <div className={cx(unreadSpaceStyle)} />
      )}
      <div className={flex} style={{textOverflow: 'ellipsis'}}>{translatedLabel}</div>
    </div>
  );
}

function MessageChooser(props: EntityChooserLabelProps<IMessage>) {

  return (
      <DefaultEntityChooserLabel {...props}>
        <MessageLabel message={props.entity}/>
      </DefaultEntityChooserLabel>
  );
}

interface MessageDisplayProps {
  entity: IMessage;
}

function MessageDisplay({ entity }: MessageDisplayProps) {
  const i18nComponentValues = useInternalTranslate(componentsTranslations);

  const subject = useTranslate(entity.subject);
  const date = useTranslate(entity.date);
  const from = useTranslate(entity.from);

  return (
    <div
      style={{width: '100%', height: '100%'}}
    >
      <div className={cx(toolboxHeaderStyle)}>
        {subject && <div className={cx(bolder)}>{subject}</div>}
        {date && (
          <div>
            {i18nComponentValues.inbox.date}: {date}
          </div>
        )}
        {from && (
          <div>
            {i18nComponentValues.inbox.sender}: {from}
          </div>
        )}
      </div>
      <TranslatableText content={entity.body} />
    </div>
  );
}

interface InboxDisplayProps extends DisabledReadonly {
  inbox: IInboxDescriptor;
}

export function InboxDisplay({ inbox, disabled, readOnly }: InboxDisplayProps) {
  const messagesSelector = React.useCallback(() => {
    const messages = getInstance(inbox, Player.selectCurrent())!.messages;
    return [...messages].sort((a, b) => {
      return (b.time ?? 0) - (a.time ?? 0);
    });
  }, [inbox]);

  const messages = useStore(messagesSelector);
  const i18nComponentValues = useInternalTranslate(componentsTranslations);

  return (
    <EntityChooser
      entities={messages}
      EntityLabel={MessageChooser}
      disabled={disabled}
      readOnly={readOnly}
      noSelectionMessage={i18nComponentValues.inbox.noSelectionMessage}
    >
      {MessageDisplay}
    </EntityChooser>
  );
}
