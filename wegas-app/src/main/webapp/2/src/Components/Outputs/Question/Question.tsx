import * as React from 'react';
import { store, useStore } from '../../../data/store';
import { IQuestionDescriptor, IWhQuestionDescriptor } from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { QuestionDisplay, questionInfo } from './SimpleQuestion';
import { whQuestionInfo, WhQuestionDisplay } from './WhQuestionDisplay';

export function ConnectedSimpleQuestionDisplay({
  entity,
}: {
  entity: Readonly<IQuestionDescriptor>;
}) {
  const questionInfoSelector = React.useCallback(() => questionInfo(entity), [
    entity,
  ]);
  const state = useStore(questionInfoSelector);
  return <QuestionDisplay {...state} dispatch={store.dispatch} />;
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
