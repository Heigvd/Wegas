import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IInboxDescriptor, IMessage } from 'wegas-ts-api';
import {
  bolder,
  defaultMarginTop,
  expandWidth,
  flex,
  flexBetween,
  flexColumn,
  flexRow,
  itemCenter,
  toolboxHeaderStyle,
} from '../../css/classes';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../data/scriptable';
import { Player } from '../../data/selectors';
import { editingStore } from '../../data/Stores/editingStore';
import { useStore } from '../../data/Stores/store';
import { wwarn } from '../../Helper/wegaslog';
import { componentsTranslations } from '../../i18n/components/components';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import {
  DefaultEntityChooserLabel,
  EntityChooser,
  EntityChooserLabelProps,
} from '../EntityChooser';
import { useTranslate } from '../Hooks/useTranslate';
import { themeVar } from '../Theme/ThemeVars';
import { TranslatableText } from './HTMLText';

interface MessageLabelProps {
  message: IMessage;
  disabled?: boolean;
}

const messageLabel = css({
  minHeight: '1em',
  maxWidth: 'auto',
  overflow: 'hidden',
});

const readLabelStyle = css({
  fontWeight: 'normal',
  backgroundColor: themeVar.colors.HeaderColor,
  color: themeVar.colors.DarkTextColor,
  '&:hover': {
    boxShadow: `2px 2px 6px 2px rgba(0, 0, 0, 0.2)`,
  },
});

const unreadLabelStyle = css({
  fontWeight: 'bold',
});

const labelTitleStyle = css({
  flexShrink: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

function MessageLabel({ message, disabled }: MessageLabelProps) {
  const translatedLabel = useTranslate(message.subject);
  const translatedFrom = useTranslate(message.from);
  const translatedDate = useTranslate(message.date);

  return (
    <div
      className={cx(flex, itemCenter, messageLabel)}
      onClick={() => !disabled && editingStore.dispatch(readMessage(message))}
    >
      <div className={cx(flex, flexColumn, expandWidth)}>
        <div className={cx(flex, flexRow, flexBetween)}>
          <div className={cx(labelTitleStyle)}>{translatedLabel}</div>
          <div className={css({ flexShrink: 0 })}>{translatedDate}</div>
        </div>
        <div className={cx(flex, defaultMarginTop)}>{translatedFrom}</div>
      </div>
    </div>
  );
}

function customLabelStyle(m: IMessage): string | undefined {
  try {
    const isUnread = instantiate(m).getUnread();
    return isUnread ? unreadLabelStyle : readLabelStyle;
  } catch (m) {
    wwarn(m);
    return undefined;
  }
}

function MessageChooser(props: EntityChooserLabelProps<IMessage>) {
  return (
    <DefaultEntityChooserLabel {...props} customLabelStyle={customLabelStyle}>
      <MessageLabel message={props.entity} />
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
    <div style={{ width: '100%', height: '100%' }}>
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
