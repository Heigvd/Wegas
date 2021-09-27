import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IReply, IChoiceDescriptor } from 'wegas-ts-api';
import { TranslatableContent } from '../../../data/i18n';
import { VariableDescriptor } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/Stores/store';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Theme/ThemeVars';
import {
  choiceContainerStyle,
  choiceLabelStyle,
  choiceDescriptionStyle,
} from './ChoiceContainer';
import { TranslatableText } from '../HTMLText';

const repliesContainer = css({
  marginTop: '5px',
  borderTop: '1px solid ' + themeVar.colors.DisabledColor,
  fontWeight: 'bold',
  fontSize: themeVar.others.TextFont2,
});

interface ReplyDisplayProps {
  reply: IReply;
}

function ReplyDisplay({ reply }: ReplyDisplayProps) {
  const ignorationAnswer = reply.ignorationAnswer;
  const answer = reply.answer;

  return (
    <div className={cx(choiceContainerStyle, css({padding: '15px'}))}>
      <StoreConsumer
        selector={() =>
          VariableDescriptor.firstMatch<IChoiceDescriptor>({
            name: reply.choiceName,
          })
        }
      >
        {({ state }) => (
          <div className={choiceLabelStyle}>
            {state != null
              ? TranslatableContent.toString(state.label)
              : 'Unkown choice'}
          </div>
        )}
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
