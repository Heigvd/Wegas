import { css } from 'emotion';
import * as React from 'react';
import { IReply, IChoiceDescriptor } from 'wegas-ts-api';
import { TranslatableContent } from '../../../data/i18n';
import { VariableDescriptor } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/Stores/store';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Style/ThemeVars';
import {
  choiceContainerStyle,
  choiceLabelStyle,
  choiceDescriptionStyle,
} from './ChoiceContainer';

const repliesContainer = css({
  marginTop: '5px',
  borderTop: '1px solid ' + themeVar.Common.colors.DisabledColor,
  fontWeight: 'bold',
  fontSize: themeVar.ComponentTitle.others.FontFamily5,
});

interface ReplyDisplayProps {
  reply: IReply;
}

function ReplyDisplay({ reply }: ReplyDisplayProps) {
  const ignorationAnswer = reply.ignorationAnswer;
  const answer = reply.answer;

  return (
    <div className={choiceContainerStyle}>
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

      <div
        className={choiceDescriptionStyle}
        dangerouslySetInnerHTML={{
          __html: reply.ignored
            ? ignorationAnswer
              ? TranslatableContent.toString(ignorationAnswer)
              : ''
            : answer
            ? TranslatableContent.toString(answer)
            : '',
        }}
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
