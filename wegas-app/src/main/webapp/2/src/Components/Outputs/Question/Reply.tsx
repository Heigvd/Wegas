import * as React from 'react';
import { IReply, IChoiceDescriptor } from 'wegas-ts-api';
import { TranslatableContent } from '../../../data/i18n';
import { VariableDescriptor } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/store';
import { Button } from '../../Inputs/Buttons/Button';
import {
  choiceContainerStyle,
  choiceLabelStyle,
  choiceDescriptionStyle,
} from './ChoiceContainer';

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
}
export function RepliesDisplay({ replies }: RepliesDisplayProps) {
  const [showAll, setShowAll] = React.useState(false);

  if (replies.length === 0) {
    return null;
  }
  return (
    <>
      {replies.length > 1 && (
        <Button
          icon={showAll ? 'caret-square-up' : 'caret-square-down'}
          onClick={() => setShowAll(showAll => !showAll)}
        />
      )}
      {showAll ? (
        replies.map(r => <ReplyDisplay key={r.id} reply={r} />)
      ) : (
        <ReplyDisplay reply={replies[replies.length - 1]} />
      )}
    </>
  );
}
