import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IReply } from 'wegas-ts-api';
import { themeVar } from '../../Theme/ThemeVars';
import { TranslatableText } from '../HTMLText';
import {
  choiceContainerStyle,
  choiceDescriptionStyle,
  choiceLabelStyle,
} from './ChoiceContainer';
import { useInternalPlayerLangTranslate } from '../../../i18n/internalTranslator';
import { componentsTranslations } from '../../../i18n/components/components';

const repliesContainer = cx(
  css({
    marginTop: '5px',
    borderBottom: '1px solid ' + themeVar.colors.DisabledColor,
    fontSize: themeVar.others.TextFont2,
  }),
  'wegas-question__reply-container',
);

const replyStyle = cx(
  css({
    fontWeight: 'bold',
    choiceLabelStyle,
    width: '100%',
    padding: '15px',
  }),
  'wegas-question__reply-label',
);

const replyContainerStyle = css({
  backgroundColor: themeVar.colors.HoverColor,
});

const earlierReplyContainerStyle = css({
  color: themeVar.colors.DisabledColor,
});

interface ReplyDisplayProps {
  reply: IReply;
  isEarlierReply?: boolean;
}

function ReplyDisplay({ reply, isEarlierReply }: ReplyDisplayProps) {
  const ignorationAnswer = reply.ignorationAnswer;
  const answer = reply.answer;

  return (
    <div
      className={cx(
        choiceContainerStyle,
        replyContainerStyle,
        isEarlierReply ? earlierReplyContainerStyle : '',
        css({ flexDirection: 'column', alignItems: 'left' }),
        'wegas-question__reply-element',
        isEarlierReply ? 'wegas-question__reply-element--earlier-reply' : '',
      )}
    >
      <TranslatableText
        className={choiceDescriptionStyle}
        content={reply.ignored ? ignorationAnswer : answer}
      />
    </div>
  );
}

interface RepliesDisplayProps {
  replies: Readonly<IReply[]>;
}

function hasContentToDisplay(reply: IReply): boolean {
  if (reply.answer && reply.answer.translations) {
    return Object.values(reply.answer.translations).some(
      t => t.translation?.trim().length > 0,
    );
  }
  return false;
}

export function RepliesDisplay({ replies }: RepliesDisplayProps) {
  const i18nValues = useInternalPlayerLangTranslate(
    componentsTranslations,
  ).question;
  const validatedReplies = replies
    .filter(r => r.validated)
    .filter(r => hasContentToDisplay(r))
    .sort((a, b) => b.createdTime - a.createdTime);
  if (validatedReplies.length === 0) {
    return null;
  }

  const resultLabel =
    validatedReplies.length > 1 ? i18nValues.results : i18nValues.result;
  return validatedReplies?.length > 0 ? (
    <div className={repliesContainer}>
      <div className={replyStyle}>{resultLabel}</div>
      {validatedReplies.map((r, i) => (
        <ReplyDisplay key={r.id} reply={r} isEarlierReply={i !== 0} />
      ))}
    </div>
  ) : null;
}
