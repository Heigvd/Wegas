import { cx } from 'emotion';
import * as React from 'react';
import {
  IQuestionDescriptor,
  IWhQuestionDescriptor,
  IListDescriptor,
  IQuestionInstance,
  IWhQuestionInstance,
} from 'wegas-ts-api';
import {
  flex,
  itemCenter,
  unreadSignalStyle,
  unreadSpaceStyle,
} from '../../../css/classes';
import { TranslatableContent } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { read } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player, VariableDescriptor } from '../../../data/selectors';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { useStore, store, StoreConsumer } from '../../../data/Stores/store';
import { EntityChooser } from '../../EntityChooser';
import { ConnectedQuestionDisplay } from './Question';

interface QuestionProps {
  variable: string;
}

export function QuestionLabel({
  questionD,
}: {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
}) {
  const unreadSelector = React.useCallback(() => {
    const player = instantiate(Player.selectCurrent());
    return {
      isUnread: instantiate(questionD).getInstance(player).isUnread(),
    };
  }, [questionD]);
  const { isUnread } = useStore(unreadSelector);

  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => {
        store.dispatch(read(instantiate(questionD).getEntity()));
      }}
    >
      {isUnread ? (
        <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />
      ) : (
        <div className={cx(unreadSpaceStyle)} />
      )}
      <div className={flex}>
        {TranslatableContent.toString(questionD.label)}
      </div>
    </div>
  );
}

// FIXME Sandra : see how to use it or if it is deprecated
// I expected it to be used in QuestionList.component, but it uses EntityChooser directly
export default function QuestionList(props: QuestionProps) {
  return (
    <StoreConsumer
      selector={() => {
        const list = VariableDescriptor.first<IListDescriptor>(
          'name',
          props.variable,
        );
        return {
          questions: flatten<IQuestionDescriptor | IWhQuestionDescriptor>(
            list,
            'QuestionDescriptor',
          ).filter(q => {
            const instance = getInstance<
              IQuestionInstance | IWhQuestionInstance
            >(q);
            if (instance != null) {
              return instance.active;
            }
            return false;
          }),
          player: instantiate(Player.selectCurrent()),
        };
      }}
    >
      {({ state }) => {
        return (
          <EntityChooser
            entities={state.questions}
            entityLabel={e => {
              return <QuestionLabel questionD={e} />;
            }}
          >
            {ConnectedQuestionDisplay}
          </EntityChooser>
        );
      }}
    </StoreConsumer>
  );
}
