import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  IChoiceDescriptor,
  IChoiceInstance,
  IQuestionDescriptor,
} from 'wegas-ts-api';
import {
  flex,
  halfOpacity,
  itemCenter,
  justifyCenter,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { selectAndValidate } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import { store, StoreDispatch } from '../../../data/Stores/store';
import { createTranslatableContent } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { themeVar } from '../../Theme/ThemeVars';
import { AddMenu } from './AddMenu';
import { ChoiceContainer } from './ChoiceContainer';
import { QuestionInfo, questionStyle } from './Question';
import { QuestionDescription } from './QuestionDescription';
import {
  buttonFactory,
  editButonBorder,
  editButtonStyle,
  makeMenuFromClass,
} from './QuestionList';
import { RepliesDisplay } from './Reply';

const simpleChoiceHoverStyle = css({
  '&:hover': {
    backgroundColor: themeVar.colors.ActiveColor,
    color: themeVar.colors.LightTextColor,
    cursor: 'pointer',
  },
  '&.disabled:hover': {
    cursor: 'default',
  },
});

interface AddChoiceMenuProps {
  questionD: IQuestionDescriptor;
}

const choices = ['SingleResultChoice', 'Choice'].map(makeMenuFromClass);

export function AddChoiceMenu({ questionD }: AddChoiceMenuProps) {
  const { lang } = React.useContext(languagesCTX);
  return (
    <AddMenu
      items={choices}
      onSelect={item => {
        store.dispatch(
          Actions.VariableDescriptorActions.createDescriptor(
            {
              '@class': item.value.descriptor,
              label: createTranslatableContent(lang, ''),
              description: createTranslatableContent(lang, 'Réponse'),
              defaultInstance: {
                '@class': 'ChoiceInstance',
              },
            } as unknown as IVariableDescriptor,
            questionD,
          ),
        );
      }}
    />
  );
}

interface AddChoiceButtonProps {
  question: IQuestionDescriptor;
}

const Plus = buttonFactory('plus');

function AddChoiceButton({ question }: AddChoiceButtonProps) {
  const { lang } = React.useContext(languagesCTX);

  return (
    <div className={cx(flex, justifyCenter, itemCenter)}>
      <Plus
        className={cx(editButtonStyle, editButonBorder)}
        onClick={() => {
          store.dispatch(
            Actions.VariableDescriptorActions.createDescriptor(
              {
                '@class': 'SingleResultChoiceDescriptor',
                label: createTranslatableContent(lang, ''),
                description: createTranslatableContent(lang, 'Réponse'),
                defaultInstance: {
                  '@class': 'ChoiceInstance',
                },
              } as unknown as IVariableDescriptor,
              question,
            ),
          );
        }}
      />
    </div>
  );
}

interface SimpleChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
  editMode?: boolean;
}

function SimpleChoiceDisplay({
  choiceD,
  choiceI,
  onValidate,
  replyAllowed,
  editMode,
}: SimpleChoiceDisplayProps) {
  const { active, replies } = choiceI;
  const { maxReplies } = choiceD;
  const hasBeenValidated = instantiate(choiceD).hasBeenSelected(Player.self());

  const validatedReplies = replies.filter(r => r.validated);
  const canReply =
    replyAllowed && (!maxReplies || validatedReplies.length < maxReplies);
  if (!active) {
    return null;
  }

  return (
    <ChoiceContainer
      active={active}
      descriptor={choiceD}
      canReply={canReply}
      onClick={() => onValidate(choiceD)}
      className={simpleChoiceHoverStyle}
      hasBeenSelected={hasBeenValidated}
      editMode={editMode}
    />
  );
}

interface SimpleQuestionDisplayProps extends QuestionInfo, DisabledReadonly {
  dispatch: StoreDispatch;
  editMode?: boolean;
}

export function SimpleQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
  editMode,
  ...options
}: SimpleQuestionDisplayProps) {
  const validatedReplies = replies.filter(r => r.validated);

  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
      dispatch(selectAndValidate(choice));
    },
    [dispatch],
  );

  if (questionD == null || questionI == null || !questionI.active) {
    return null;
  }

  const canReply =
    (questionD.maxReplies == null ||
      validatedReplies.length < questionD.maxReplies) &&
    isActionAllowed(options);

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
          <SimpleChoiceDisplay
            key={`${choiceD.id}${i}`}
            onValidate={onChoiceValidate}
            choiceD={choiceD}
            choiceI={choiceI}
            replyAllowed={canReply}
            editMode={editMode}
          />
        );
      })}
      {editMode && <AddChoiceButton question={questionD} />}
      <RepliesDisplay replies={replies} />
    </div>
  );
}
