import * as React from 'react';
import { IChoiceDescriptor, IChoiceInstance } from 'wegas-ts-api';
import { selectAndValidate } from '../../../data/Reducer/VariableInstanceReducer';
import { StoreDispatch } from '../../../data/Stores/store';
import { Button } from '../../Inputs/Buttons/Button';
import { ChoiceContainer } from './ChoiceContainer';
import { QuestionInfo, questionStyle } from './Question';
import { RepliesDisplay } from './Reply';
import { TranslatableText } from '../Text';

interface SimpleChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
}

function SimpleChoiceDisplay({
  choiceD,
  choiceI,
  onValidate,
  replyAllowed,
}: SimpleChoiceDisplayProps) {
  const { active, replies } = choiceI;
  const { maxReplies } = choiceD;

  const validatedReplies = replies.filter(r => r.validated);
  const canReply =
    replyAllowed && (!maxReplies || validatedReplies.length < maxReplies);

  if (!active) {
    return null;
  }

  return (
    <ChoiceContainer active={active} descriptor={choiceD} canReply={canReply}>
      {(replyAllowed || validatedReplies.length > 0) && (
        <Button
          icon="check"
          onClick={() => onValidate(choiceD)}
          disabled={!canReply}
          label={validatedReplies.length ? validatedReplies.length : undefined}
        />
      )}
    </ChoiceContainer>
  );
}

interface SimpleQuestionDisplayProps extends QuestionInfo {
  dispatch: StoreDispatch;
}

export function SimpleQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
}: SimpleQuestionDisplayProps) {
  const validatedReplies = replies.filter(r => r.validated);

  const canReply =
    questionD.maxReplies == null ||
    validatedReplies.length < questionD.maxReplies;

  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
      dispatch(selectAndValidate(choice));
    },
    [dispatch],
  );

  if (questionI == null || !questionI.active) {
    return null;
  }

  return (
    <div className={questionStyle}>
      <TranslatableText
        content= {questionD.description}
      />
      {choicesD.map((choiceD, i) => {
        const choiceI = choicesI[i];
        if (choiceI == null) {
          return <span key={choiceD.id} />;
        }
        return (
          <SimpleChoiceDisplay
            key={choiceD.id}
            onValidate={onChoiceValidate}
            choiceD={choiceD}
            choiceI={choiceI}
            replyAllowed={canReply}
          />
        );
      })}
      <RepliesDisplay replies={replies} />
    </div>
  );
}
