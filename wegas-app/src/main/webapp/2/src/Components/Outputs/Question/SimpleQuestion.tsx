import { cx } from 'emotion';
import * as React from 'react';
import {
  IQuestionDescriptor,
  IQuestionInstance,
  IChoiceDescriptor,
  IChoiceInstance,
  IReply,
} from 'wegas-ts-api';
import { TranslatableContent } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import {
  toggleReply,
  selectAndValidate,
  validateQuestion,
} from '../../../data/Reducer/VariableInstanceReducer';
import { getChoices } from '../../../data/scriptable/impl/QuestionDescriptor';
import { StoreDispatch } from '../../../data/store';
import { Button } from '../../Inputs/Buttons/Button';
import {
  ChoiceContainer,
  choiceContainerStyle,
  choiceInputStyle,
} from './ChoiceContainer';
import { RepliesDisplay } from './Reply';

interface QuestionInfo {
  questionD: Readonly<IQuestionDescriptor>;
  questionI: Readonly<IQuestionInstance> | undefined;
  choicesD: Readonly<IChoiceDescriptor>[];
  choicesI: (Readonly<IChoiceInstance> | undefined)[];
  replies: Readonly<IReply[]>;
}

/**
 * Query subtree / instance about a QuestionDescriptor
 * @param question QuestionDescriptor to query
 */
export function questionInfo(question: IQuestionDescriptor): QuestionInfo {
  const choicesD = getChoices(question);
  const choicesI = choicesD.map(c => getInstance(c));
  return {
    questionD: question,
    questionI: getInstance(question),
    choicesD,
    choicesI,
    replies: choicesI
      .reduce<IReply[]>((c, i) => {
        if (i == null) {
          return c;
        }
        return c.concat(i.replies);
      }, [])
      .sort((a, b) => a.createdTime - b.createdTime),
  };
}

interface ChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  questionD: IQuestionDescriptor;
  replies: Readonly<IReply[]>;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
}

function ChoiceDisplay({
  choiceD,
  choiceI,
  questionD,
  replies,
  onValidate,
  replyAllowed,
}: ChoiceDisplayProps) {
  const { maxReplies } = choiceD;
  const { active } = choiceI;

  if (!active) {
    return null;
  }
  const canReply =
    (replyAllowed &&
      (typeof maxReplies !== 'number' || replies.length < maxReplies)) ||
    (questionD.cbx && choiceI.replies.length > 0);

  const questionChoosed =
    replies.filter(r => !r.ignored).find(r => r.choiceName === choiceD.name) !==
    undefined;

  return (
    <ChoiceContainer active={active} descriptor={choiceD} canReply={canReply}>
      {questionD.cbx ? (
        <input
          type="checkbox"
          checked={questionChoosed}
          onChange={() => onValidate(choiceD)}
          disabled={!canReply}
        />
      ) : canReply || questionChoosed ? (
        <Button
          icon="check"
          onClick={() => onValidate(choiceD)}
          disabled={!canReply}
          label={replies.length ? replies.length : undefined}
        />
      ) : null}
    </ChoiceContainer>
  );
}

interface QuestionDisplayProps extends QuestionInfo {
  dispatch: StoreDispatch;
}

export function QuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
}: QuestionDisplayProps) {
  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
      debugger;
      if (questionD.cbx) {
        dispatch(toggleReply(choice));
      } else {
        dispatch(selectAndValidate(choice));
      }
    },
    [questionD, dispatch],
  );

  if (questionI == null || !questionI.active) {
    return null;
  }

  const canReply =
    questionD.maxReplies == null || replies.length < questionD.maxReplies;
  return (
    <>
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
          <ChoiceDisplay
            key={choiceD.id}
            onValidate={onChoiceValidate}
            questionD={questionD}
            choiceD={choiceD}
            choiceI={choiceI}
            replies={replies}
            replyAllowed={canReply}
          />
        );
      })}
      {questionD.cbx && (
        <div className={cx(choiceContainerStyle, choiceInputStyle)}>
          <Button
            label={questionI.validated ? 'Validated' : 'Validate'}
            onClick={() => dispatch(validateQuestion(questionD))}
            disabled={questionI.validated}
          />
        </div>
      )}
      <RepliesDisplay replies={replies} />
    </>
  );
}
