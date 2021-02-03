import * as React from 'react';
import { store, useStore } from '../../../data/Stores/store';
import {
  IQuestionDescriptor,
  IWhQuestionDescriptor,
  IQuestionInstance,
  IChoiceDescriptor,
  IChoiceInstance,
  IReply,
} from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { SimpleQuestionDisplay } from './SimpleQuestionDisplay';
import { whQuestionInfo, WhQuestionDisplay } from './WhQuestionDisplay';
import { getChoices } from '../../../data/scriptable/impl/QuestionDescriptor';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { CbxQuestionDisplay } from './CbxQuestion';
import { css } from 'emotion';
import { select } from '../../../data/selectors/VariableDescriptorSelector';

export interface QuestionInfo {
  questionD: Readonly<IQuestionDescriptor>;
  questionI: Readonly<IQuestionInstance> | undefined;
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
export function questionInfo(question: IQuestionDescriptor): QuestionInfo {
  const questionD = select<IQuestionDescriptor>(question.id)!;
  const choicesD = getChoices(question);
  const choicesI = choicesD.map(c => getInstance(c));

  return {
    questionD,
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

export function ConnectedSimpleQuestionDisplay({
  entity,
}: {
  entity: Readonly<IQuestionDescriptor>;
}) {
  const questionInfoSelector = React.useCallback(() => questionInfo(entity), [
    entity,
  ]);
  const state = useStore(questionInfoSelector);

  return state.questionD.cbx ? (
    <CbxQuestionDisplay {...state} dispatch={store.dispatch} />
  ) : (
    <SimpleQuestionDisplay {...state} dispatch={store.dispatch} />
  );
}

export function ConnectedWhQuestionDisplay({
  entity,
}: {
  entity: Readonly<IWhQuestionDescriptor>;
}) {
  const questionInfoSelector = React.useCallback(() => whQuestionInfo(entity), [
    entity,
  ]);
  const state = useStore(questionInfoSelector);
  return <WhQuestionDisplay {...state} dispatch={store.dispatch} />;
}

export function ConnectedQuestionDisplay({
  entity,
}: {
  entity: Readonly<IQuestionDescriptor | IWhQuestionDescriptor>;
}) {
  return entityIs(entity, 'QuestionDescriptor') ? (
    <ConnectedSimpleQuestionDisplay entity={entity} />
  ) : (
    <ConnectedWhQuestionDisplay entity={entity} />
  );
}
