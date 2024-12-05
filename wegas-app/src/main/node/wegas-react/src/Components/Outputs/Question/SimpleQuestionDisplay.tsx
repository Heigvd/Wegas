import { cx } from '@emotion/css';
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
import { createTranslatableContent } from '../../../data/i18n';
import { selectAndValidate } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import {
  editingStore,
  EditingStoreDispatch,
} from '../../../data/Stores/editingStore';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { AddMenu } from './AddMenu';
import { ChoiceContainer } from './ChoiceContainer';
import { QuestionInfo, questionStyle } from './Question';
import { QuestionDescription } from './QuestionDescription';
import {
  buttonFactory,
  editButtonBorder,
  editButtonStyle,
  makeMenuFromClass,
} from './QuestionList';
import { RepliesDisplay } from './Reply';
import { groupBy } from 'lodash-es';

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
        editingStore.dispatch(
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
        className={cx(editButtonStyle, editButtonBorder)}
        onClick={() => {
          editingStore.dispatch(
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
  onValidate: (choice: IChoiceDescriptor) => Promise<unknown>;
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
      hasBeenSelected={hasBeenValidated}
      editMode={editMode}
    />
  );
}

interface SimpleQuestionDisplayProps extends QuestionInfo, DisabledReadonly {
  dispatch: EditingStoreDispatch;
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
  const validatedRepliesCount = replies.filter(r => r.validated).length;

  const repliesMap = groupBy(replies, r => r.parentId);

  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
      return dispatch(selectAndValidate({ choice }));
    },
    [dispatch],
  );

  if (questionD == null || questionI == null || !questionI.active) {
    return null;
  }

  const canReply =
    !questionI.validated &&
    (questionD.maxReplies == null ||
      validatedRepliesCount < questionD.maxReplies) &&
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
        const replySet = choiceI.id && repliesMap[choiceI.id] ? repliesMap[choiceI.id] : []
        return (
          <>
            <SimpleChoiceDisplay
              key={`${choiceD.id}${i}`}
              onValidate={onChoiceValidate}
              choiceD={choiceD}
              choiceI={choiceI}
              replyAllowed={canReply}
              editMode={editMode}
            />
            <RepliesDisplay replies={replySet} />
          </>
        );
      })}
      {editMode && <AddChoiceButton question={questionD} />}
    </div>
  );
}

