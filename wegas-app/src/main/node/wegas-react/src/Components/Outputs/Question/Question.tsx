import { css } from '@emotion/css';
import * as React from 'react';
import {
  IChoiceDescriptor,
  IChoiceInstance,
  IQuestionDescriptor,
  IQuestionInstance,
  IReply,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { State } from '../../../data/Reducer/reducers';
import { select } from '../../../data/selectors/VariableDescriptorSelector';
import { store, useStore } from '../../../data/Stores/store';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { CbxQuestionDisplay } from './CbxQuestion';
import { SimpleQuestionDisplay } from './SimpleQuestionDisplay';
import { WhQuestionDisplay, whQuestionInfo } from './WhQuestionDisplay';

export interface QuestionInfo {
  questionD?: Readonly<IQuestionDescriptor>;
  questionI?: Readonly<IQuestionInstance> | undefined;
  choicesD: Readonly<IChoiceDescriptor>[];
  choicesI: (Readonly<IChoiceInstance> | undefined)[];
  replies: Readonly<IReply[]>;
}

export const questionStyle = css({
  width: 'fit-content',
});

/**
 * Query subtree / instance about a QuestionDescriptor
 * @param question QuestionDescriptor to query
 */
export function questionInfo(question: IQuestionDescriptor) {
  return function (s: Readonly<State>): QuestionInfo {
    const questionD = select<IQuestionDescriptor>(question.id);
    const choicesD = questionD?.itemsIds
      .map(id => s.variableDescriptors[id])
      .filter(function (
        entity: IChoiceDescriptor | undefined,
      ): entity is IChoiceDescriptor {
        return entity != null;
      });
    const choicesI = choicesD?.map(c => getInstance(c)) || [];

    return {
      questionD,
      questionI: getInstance(question),
      choicesD: choicesD || [],
      choicesI,
      replies: (choicesI || [])
        .reduce<IReply[]>((c, i) => {
          if (i == null) {
            return c;
          }
          return c.concat(i.replies);
        }, [])
        .sort((a, b) => a.createdTime - b.createdTime),
    };
  };
}

interface ConnectedSimpleQuestionDisplayProps extends DisabledReadonly {
  entity: Readonly<IQuestionDescriptor>;
  editMode?: boolean;
}

export function ConnectedSimpleQuestionDisplay({
  entity,
  ...options
}: ConnectedSimpleQuestionDisplayProps) {
  const state = useStore(questionInfo(entity), deepDifferent);
  if (state.questionD == null) {
    return null;
  }
  return state.questionD.cbx ? (
    <CbxQuestionDisplay {...state} dispatch={store.dispatch} {...options} />
  ) : (
    <SimpleQuestionDisplay {...state} dispatch={store.dispatch} {...options} />
  );
}

interface ConnectedWhQuestionDisplay extends DisabledReadonly {
  entity: Readonly<IWhQuestionDescriptor>;
  editMode?: boolean;
}

export function ConnectedWhQuestionDisplay({
  entity,
  disabled,
  readOnly,
  editMode,
}: ConnectedWhQuestionDisplay) {
  const state = useStore(whQuestionInfo(entity), deepDifferent);
  return (
    <WhQuestionDisplay
      {...state}
      dispatch={store.dispatch}
      disabled={disabled}
      readOnly={readOnly}
      editMode={editMode}
    />
  );
}

export interface ConnectedQuestionDisplayProps extends DisabledReadonly {
  entity: Readonly<IQuestionDescriptor | IWhQuestionDescriptor>;
  editMode?: boolean;
}

export function ConnectedQuestionDisplay({
  entity,
  disabled,
  readOnly,
  editMode,
}: ConnectedQuestionDisplayProps) {
  return entityIs(entity, 'QuestionDescriptor') ? (
    <ConnectedSimpleQuestionDisplay
      entity={entity}
      disabled={disabled}
      readOnly={readOnly}
      editMode={editMode}
    />
  ) : (
    <ConnectedWhQuestionDisplay
      entity={entity}
      disabled={disabled}
      readOnly={readOnly}
      editMode={editMode}
    />
  );
}
