import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IChoiceDescriptor, IChoiceInstance } from 'wegas-ts-api';
import { autoMargin, halfOpacity } from '../../../css/classes';
import {
  selectChoice,
  toggleReply,
  validateQuestion,
} from '../../../data/Reducer/VariableInstanceReducer';
import { EditingStoreDispatch } from '../../../data/Stores/editingStore';
import { MessageString } from '../../../Editor/Components/MessageString';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { Button } from '../../Inputs/Buttons/Button';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { themeVar } from '../../Theme/ThemeVars';
import { ChoiceContainer, choiceInputStyle } from './ChoiceContainer';
import { QuestionInfo, questionStyle } from './Question';
import { QuestionDescription } from './QuestionDescription';
import { RepliesDisplay } from './Reply';
import { AddChoiceMenu } from './SimpleQuestionDisplay';

const cbxChoiceContainerStyle = css({
  cursor: 'pointer',
  display: 'flex',
});
const cbxContainerStyle = css({
  padding: 0,
  width: '3rem',
  backgroundColor: themeVar.colors.PrimaryColor,
  color: themeVar.colors.LightTextColor,
  justifyContent: 'center',
  borderRadius:
    '0px ' +
    themeVar.dimensions.BorderRadius +
    ' ' +
    themeVar.dimensions.BorderRadius +
    ' 0px',
  borderLeft: '1px solid ' + themeVar.colors.HeaderColor,
  '&:hover': {
    backgroundColor: themeVar.colors.ActiveColor,
    borderLeft: '1px solid ' + themeVar.colors.ActiveColor,
  },
});
const cbxStyle = css({
  '&.wegas.wegas-btn': {
    color: themeVar.colors.LightTextColor,
    '&:hover': {
      color: themeVar.colors.LightTextColor,
    },
  },
});
interface CbxChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
  maxReplyReached: boolean;
  radioButton: boolean;
  editMode?: boolean;
}

function CbxChoiceDisplay({
  choiceD,
  choiceI,
  onValidate,
  replyAllowed,
  maxReplyReached,
  radioButton,
  editMode,
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
    <ChoiceContainer
      active={active}
      descriptor={choiceD}
      canReply={!disabled}
      hasBeenSelected={questionChoosed}
      className={cbxChoiceContainerStyle}
      inputClassName={cbxContainerStyle}
      onClick={async () => {
        if (enableValidate) {
          return onValidate(choiceD);
        }
      }}
      editMode={editMode}
    >
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
          checkBoxClassName={cbxStyle}
        />
      }
    </ChoiceContainer>
  );
}

interface CbxQuestionDisplayProps extends QuestionInfo, DisabledReadonly {
  dispatch: EditingStoreDispatch;
  editMode?: boolean;
}

export function CbxQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
  editMode,
  ...options
}: CbxQuestionDisplayProps) {
  const { maxReplies, minReplies } = questionD || {};

  const canReply =
    questionI != null && !questionI.validated && isActionAllowed(options);
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

  if (questionD == null || questionI == null || !questionI.active) {
    return null;
  }

  return (
    <div
      className={cx(questionStyle, {
        [halfOpacity]: options.disabled,
      })}
    >
      <QuestionDescription questionD={questionD} editMode={editMode} />
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
            editMode={editMode}
          />
        );
      })}
      {editMode && <AddChoiceMenu questionD={questionD} />}
      {!questionI.validated && (
        <div className={cx(choiceInputStyle)}>
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
            disabled={remainingChoices > 0 || options.disabled}
            readOnly={options.readOnly}
          />
        </div>
      )}
      <RepliesDisplay replies={replies} showAll />
    </div>
  );
}
