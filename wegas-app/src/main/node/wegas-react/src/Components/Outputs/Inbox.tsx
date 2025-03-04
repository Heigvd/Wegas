import { css, cx } from '@emotion/css';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IAttachment, IInboxDescriptor, IMessage } from 'wegas-ts-api';
import {
  bolder,
  defaultMarginBottom,
  defaultMarginTop,
  defaultPadding,
  expandWidth,
  flex,
  flexBetween,
  flexColumn,
  flexRow,
  flexWrap,
  itemCenter,
  toolboxHeaderStyle,
  unreadSignalStyle,
} from '../../css/classes';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { readMessage } from '../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../data/scriptable';
import { Player } from '../../data/selectors';
import { editingStore } from '../../data/Stores/editingStore';
import { useStore } from '../../data/Stores/store';
import { componentsTranslations } from '../../i18n/components/components';
import { useInternalPlayerLangTranslate } from '../../i18n/internalTranslator';
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
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { translate } from '../../data/i18n';

interface MessageLabelProps {
  message: IMessage;
}

const messageLabel = css({
  minHeight: '1em',
  maxWidth: 'auto',
  overflow: 'hidden',
});

const readLabelStyle = cx(
  css({
    fontWeight: 'normal',
    backgroundColor: themeVar.colors.HeaderColor,
    color: themeVar.colors.DarkTextColor,
    '&:hover': {
      boxShadow: `2px 2px 6px 2px rgba(0, 0, 0, 0.4)`,
    },
  }),
  'wegas-inbox--read',
);

const unreadLabelStyle = cx(
  css({
    fontWeight: 'bold',
  }),
  unreadSignalStyle,
  'wegas-inbox--unread',
);

const labelTitleStyle = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const labelSenderStyle = css({
  flexShrink: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const labelDateStyle = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

const displayDateStyle = css({
  alignSelf: 'flex-end',
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
    <div
      className={cx(
        flex,
        expandWidth,
        itemCenter,
        messageLabel,
        defaultPadding,
      )}
    >
      <div className={cx(flex, flexColumn, expandWidth)}>
        <div className={cx(labelTitleStyle, 'wegas-inbox__label-subject')}>
          {translatedLabel}
        </div>
        <div className={cx(flex, flexRow, flexBetween)}>
          {translatedFrom && (
            <div
              className={cx(
                defaultMarginTop,
                labelSenderStyle,
                'wegas-inbox__label-from',
              )}
            >
              {translatedFrom}
            </div>
          )}
          {translatedDate && (
            <div
              className={cx(
                defaultMarginTop,
                labelDateStyle,
                'wegas-inbox__label-date',
              )}
            >
              &nbsp;{translatedDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageChooser(props: EntityChooserLabelProps<IMessage>) {
  const message = props.entity;
  const unreadSelector = React.useCallback(() => {
    return {
      isUnread: instantiate(message).getUnread(),
    };
  }, [message]);
  const { isUnread } = useStore(unreadSelector);

  return (
    <DefaultEntityChooserLabel {...props}>
      <div
        className={cx(
          flex,
          flexRow,
          itemCenter,
          'wegas-inbox__choice',
          isUnread ? unreadLabelStyle : readLabelStyle,
        )}
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
  const files = attachments.map(attachment =>
    translate(attachment.file, lang, availableLang),
  );

  return (
    <div className={cx(attachmentDisplay, 'wegas-inbox__attachments-list')}>
      {files.map((file, index) => (
        <span
          className={cx(css({ marginLeft: '5px' }), 'wegas-inbox__attachment')}
          key={index}
        >
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
  const i18nComponentValues = useInternalPlayerLangTranslate(
    componentsTranslations,
  );

  const subject = useTranslate(entity.subject);
  const date = useTranslate(entity.date);
  const from = useTranslate(entity.from);
  const attachments = entity.attachments;

  return (
    <div className={cx(defaultEntityDisplay, 'wegas-inbox__display')}>
      <div
        className={cx(
          flex,
          flexColumn,
          toolboxHeaderStyle,
          'wegas-inbox__header',
        )}
      >
        {subject && (
          <div
            className={cx(
              bolder,
              defaultMarginBottom,
              'wegas-inbox__display-subject',
            )}
          >
            {subject}
          </div>
        )}
        {date && (
          <div className={cx(displayDateStyle, 'wegas-inbox__display-date')}>
            {date}
          </div>
        )}
        {from && (
          <div className="wegas-inbox__display-from">
            {i18nComponentValues.inbox.sender}: {from}
          </div>
        )}
        {attachments.length > 0 && (
          <div className={cx(flex, flexRow, css({ whiteSpace: 'nowrap' }))}>
            {i18nComponentValues.inbox.attachments}:
            <AttachmentsDisplay attachments={attachments} />
          </div>
        )}
      </div>
      <TranslatableText content={entity.body} className="wegas-inbox__body" />
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
  const i18nComponentValues = useInternalPlayerLangTranslate(
    componentsTranslations,
  );

  return (
    <EntityChooser
      entities={messages}
      EntityLabel={MessageChooser}
      disabled={disabled}
      readOnly={readOnly}
      noSelectionMessage={i18nComponentValues.inbox.noSelectionMessage}
      mobileDisplay={mobileDisplay}
      className={cx(className, 'wegas-inbox')}
      style={style}
    >
      {props => <MessageDisplay {...props} />}
    </EntityChooser>
  );
}
