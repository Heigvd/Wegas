import { css, cx } from '@emotion/css';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IAttachment, IInboxDescriptor, IMessage } from 'wegas-ts-api';
import {
  bolder,
  defaultMarginBottom,
  defaultMarginTop,
  expandWidth,
  flex,
  flexBetween,
  flexColumn,
  flexRow,
  flexWrap,
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
  defaultEntityDisplay,
  EntityChooser,
  EntityChooserLabelProps,
} from '../EntityChooser';
import { useTranslate } from '../Hooks/useTranslate';
import { themeVar } from '../Theme/ThemeVars';
import { TranslatableText } from './HTMLText';
import { fileURL } from '../../API/files.api';
import {languagesCTX} from "../Contexts/LanguagesProvider";
import {translate} from "../../data/i18n";

interface MessageLabelProps {
  message: IMessage;
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
    boxShadow: `2px 2px 6px 2px rgba(0, 0, 0, 0.4)`,
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

const attachmentDisplay = cx(
  flex,
  flexRow,
  flexWrap,
  css({ flexShrink: 0, marginLeft: '5px', width: '100%' }),
);

function MessageLabel({ message }: MessageLabelProps) {
  const translatedLabel = useTranslate(message.subject);
  const translatedFrom = useTranslate(message.from);
  const translatedDate = useTranslate(message.date);

  return (
    <div className={cx(flex, itemCenter, messageLabel)}>
      <div className={cx(flex, flexColumn, expandWidth)}>
        <div className={cx(flex, flexRow, flexBetween)}>
          <div className={cx(labelTitleStyle)}>{translatedLabel}</div>
          {translatedDate && (
            <div className={css({ flexShrink: 0 })}>&nbsp;{translatedDate}</div>
          )}
        </div>
        {translatedFrom && (
          <div className={cx(flex, defaultMarginTop)}>{translatedFrom}</div>
        )}
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
  const message = props.entity;

  return (
    <DefaultEntityChooserLabel {...props} customLabelStyle={customLabelStyle}>
      <div
        className={cx(flex, flexRow, itemCenter)}
        onClick={() => editingStore.dispatch(readMessage(message))}
      >
        {props.mobile && (
          <FontAwesomeIcon
            className={css({ marginRight: '5px' })}
            icon={faArrowLeft}
            size="1x"
          />
        )}
        <MessageLabel message={props.entity} />
      </div>
    </DefaultEntityChooserLabel>
  );
}

interface AttachmentsDisplayProps {
  attachments: IAttachment[];
}

function AttachmentsDisplay({ attachments }: AttachmentsDisplayProps) {
  const { lang, availableLang } = React.useContext(languagesCTX);
  const files = attachments.map(attachment => translate(attachment.file, lang, availableLang));

  return (
    <div className={attachmentDisplay}>
      {files.map((file, index) => (
        <span className={css({ marginLeft: '5px' })} key={index}>
          <a href={fileURL(file)} target="_blank" rel="noreferrer">
            {file.slice(1)}
          </a>
          {index < files.length - 1 && ','}
        </span>
      ))}
    </div>
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
  const attachments = entity.attachments;

  return (
    <div className={defaultEntityDisplay}>
      <div className={cx(toolboxHeaderStyle)}>
        {subject && (
          <div className={cx(bolder, defaultMarginBottom)}>{subject}</div>
        )}
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
        {attachments.length > 0 && (
          <div className={cx(flex, flexRow, css({whiteSpace: 'nowrap'}))}>
            {i18nComponentValues.inbox.attachments}:
            <AttachmentsDisplay attachments={attachments}/>
          </div>
        )}
      </div>
      <TranslatableText content={entity.body} />
    </div>
  );
}

interface InboxDisplayProps extends DisabledReadonly, ClassStyleId {
  inbox: IInboxDescriptor;
  mobileDisplay?: boolean;
}

export function InboxDisplay({
  inbox,
  disabled,
  readOnly,
  mobileDisplay,
  className,
  style,
}: InboxDisplayProps) {
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
      mobileDisplay={mobileDisplay}
      className={className}
      style={style}
    >
      {props => <MessageDisplay {...props} />}
    </EntityChooser>
  );
}
