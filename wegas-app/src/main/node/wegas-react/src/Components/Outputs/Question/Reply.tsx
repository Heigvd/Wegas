import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IChoiceDescriptor, IReply } from 'wegas-ts-api';
import { VariableDescriptor } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/Stores/store';
import { themeVar } from '../../Theme/ThemeVars';
import { TranslatableText } from '../HTMLText';
import {
  choiceContainerStyle,
  choiceDescriptionStyle,
  choiceLabelStyle,
} from './ChoiceContainer';

const repliesContainer = css({
  marginTop: '5px',
  borderBottom: '1px solid ' + themeVar.colors.DisabledColor,
  fontSize: themeVar.others.TextFont2,
});
const replyStyle = css({
  fontWeight: 'bold',
  choiceLabelStyle,
  width: '100%',
  padding: '15px',
});
const replyContainerStyle = css({
  backgroundColor: themeVar.colors.HoverColor,
});
const earlierReplyContainerStyle = css({
  color: themeVar.colors.DisabledColor,
})

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
      )}
    >
      <StoreConsumer
        selector={() =>
          VariableDescriptor.firstMatch<IChoiceDescriptor>({
            name: reply.choiceName,
          })
        }
      >
        {({ state }) =>
          state != null ? (
            <TranslatableText className={replyStyle} content={state.label} />
          ) : (
            <div className={choiceLabelStyle}>'Unknown choice'</div>
          )
        }
      </StoreConsumer>

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

export function RepliesDisplay({ replies }: RepliesDisplayProps) {
  const nonIgnoredValidatedReplies = replies
    .filter(r => !r.ignored)
    .filter(r => r.validated)
    .sort((a, b) => b.createdTime - a.createdTime);
  if (nonIgnoredValidatedReplies.length === 0) {
    return null;
  }
  return (
    <div className={repliesContainer}>
      {nonIgnoredValidatedReplies.map((r,i) => (
        <ReplyDisplay key={r.id} reply={r} isEarlierReply={i !== 0}/>
      ))}
    </div>
  );
}
