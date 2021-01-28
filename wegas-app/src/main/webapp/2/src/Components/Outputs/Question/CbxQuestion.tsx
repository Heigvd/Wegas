import { cx } from 'emotion';
import * as React from 'react';
import { IChoiceDescriptor, IChoiceInstance } from 'wegas-ts-api';
import { autoMargin } from '../../../css/classes';
import { TranslatableContent } from '../../../data/i18n';
import {
  selectChoice,
  toggleReply,
  validateQuestion,
} from '../../../data/Reducer/VariableInstanceReducer';
import { StoreDispatch } from '../../../data/Stores/store';
import { MessageString } from '../../../Editor/Components/MessageString';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { Button } from '../../Inputs/Buttons/Button';
import {
  ChoiceContainer,
  choiceContainerStyle,
  choiceInputStyle,
} from './ChoiceContainer';
import { QuestionInfo, questionStyle } from './Question';
import { RepliesDisplay } from './Reply';

interface CbxChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
  maxReplyReached: boolean;
  radioButton: boolean;
}

function CbxChoiceDisplay({
  choiceD,
  choiceI,
  onValidate,
  replyAllowed,
  maxReplyReached,
  radioButton,
}: CbxChoiceDisplayProps) {
  const { active, replies } = choiceI;

  const questionChoosed = replies.filter(r => !r.ignored).length > 0;
  const disabled =
    !replyAllowed || (maxReplyReached && !questionChoosed && !radioButton);
  const enableValidate = !radioButton || !questionChoosed;

  if (!active) {
    return null;
  }

  return (
    <ChoiceContainer active={active} descriptor={choiceD} canReply={!disabled}>
      {
        <CheckBox
          className={autoMargin}
          value={questionChoosed}
          onChange={() => {
            if (enableValidate) {
              onValidate(choiceD);
            }
          }}
          disabled={disabled}
          radio={radioButton}
        />
      }
    </ChoiceContainer>
  );
}

interface CbxQuestionDisplayProps extends QuestionInfo {
  dispatch: StoreDispatch;
}

export function CbxQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
}: CbxQuestionDisplayProps) {
  const { maxReplies, minReplies } = questionD;

  const canReply = questionI != null && !questionI.validated;
  const maxReplyReached = maxReplies != null && replies.length >= maxReplies;
  const remainingChoices = minReplies == null ? 0 : minReplies - replies.length;
  const radio = maxReplies === 1 && minReplies === 1;

  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
      if (radio) {
        dispatch(selectChoice(choice));
      } else {
        dispatch(toggleReply(choice));
      }
    },
    [dispatch, radio],
  );

  if (questionI == null || !questionI.active) {
    return null;
  }

  return (
    <div className={questionStyle}>
      <div
        dangerouslySetInnerHTML={{
          __html: questionD.description
            ? TranslatableContent.toString(questionD.description)
            : '',
        }}
      />
      {choicesD.map((choiceD, i) => {
        const choiceI = choicesI[i];
        if (choiceI == null) {
          return <span key={choiceD.id} />;
        }
        return (
          <CbxChoiceDisplay
            key={choiceD.id}
            onValidate={onChoiceValidate}
            choiceD={choiceD}
            choiceI={choiceI}
            replyAllowed={canReply}
            maxReplyReached={maxReplyReached}
            radioButton={radio}
          />
        );
      })}
      {!questionI.validated && (
        <div className={cx(choiceContainerStyle, choiceInputStyle)}>
          {remainingChoices > 0 && (
            <MessageString
              type="warning"
              value={`You need to select ${remainingChoices} more choice${
                remainingChoices > 1 ? 's' : ''
              }`}
            />
          )}
          <Button
            className={autoMargin}
            label={'Validate'}
            onClick={() => dispatch(validateQuestion(questionD))}
            disabled={remainingChoices > 0}
          />
        </div>
      )}
      <RepliesDisplay replies={replies} showAll />
    </div>
  );
}
