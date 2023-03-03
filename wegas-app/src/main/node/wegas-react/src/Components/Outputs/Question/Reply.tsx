import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IChoiceDescriptor, IReply } from 'wegas-ts-api';
import { VariableDescriptor } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/Stores/store';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Theme/ThemeVars';
import { TranslatableText } from '../HTMLText';
import {
  choiceContainerStyle,
  choiceDescriptionStyle,
  choiceLabelStyle,
} from './ChoiceContainer';

const repliesContainer = css({
  marginTop: '5px',
  borderTop: '1px solid ' + themeVar.colors.DisabledColor,
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

interface ReplyDisplayProps {
  reply: IReply;
}

function ReplyDisplay({ reply }: ReplyDisplayProps) {
  const ignorationAnswer = reply.ignorationAnswer;
  const answer = reply.answer;

  return (
    <div
      className={cx(
        choiceContainerStyle,
        replyContainerStyle,
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
            <div className={choiceLabelStyle}>'Unkown choice'</div>
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
  showAll?: boolean;
}
export function RepliesDisplay({ replies, showAll }: RepliesDisplayProps) {
  const [expanded, setExpanded] = React.useState(showAll || false);

  const nonIgnoredValidatedReplies = replies
    .filter(r => !r.ignored)
    .filter(r => r.validated);

  if (nonIgnoredValidatedReplies.length === 0) {
    return null;
  }
  return (
    <div className={repliesContainer}>
      {!showAll && nonIgnoredValidatedReplies.length > 1 && (
        <Button
          icon={expanded ? 'caret-square-up' : 'caret-square-down'}
          onClick={() => setExpanded(expanded => !expanded)}
        />
      )}
      {expanded ? (
        nonIgnoredValidatedReplies.map(r => (
          <ReplyDisplay key={r.id} reply={r} />
        ))
      ) : (
        <ReplyDisplay
          reply={
            nonIgnoredValidatedReplies[nonIgnoredValidatedReplies.length - 1]
          }
        />
      )}
    </div>
  );
}
