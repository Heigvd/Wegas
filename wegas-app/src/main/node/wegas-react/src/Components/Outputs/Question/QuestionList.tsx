import { cx, css } from '@emotion/css';
import * as React from 'react';
import {
  IQuestionDescriptor,
  IWhQuestionDescriptor,
  IQuestionInstance,
  IWhQuestionInstance,
  SListDescriptor,
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
import { Player } from '../../../data/selectors';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { useStore, store } from '../../../data/Stores/store';
import { EntityChooser } from '../../EntityChooser';
import { themeVar } from '../../Theme/ThemeVars';
import { ConnectedQuestionDisplay } from './Question';

const repliedLabelStyle = css({
  backgroundColor: themeVar.colors.LightTextColor,
  color: themeVar.colors.PrimaryColor,
  border: '2px solid ' + themeVar.colors.PrimaryColor,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: themeVar.colors.LightTextColor,
    color: themeVar.colors.ActiveColor,
    border: '2px solid ' + themeVar.colors.ActiveColor,
  },
});

/*interface QuestionProps {
  variable: string;
}*/

export function QuestionLabel({
  questionD,
  disabled,
}: {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
  disabled?: boolean;
}) {
  const unreadSelector = React.useCallback(() => {
    return {
      isUnread: instantiate(questionD).getInstance(Player.self()).isUnread(),
    };
  }, [questionD]);
  const { isUnread } = useStore(unreadSelector);

  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => {
        !disabled && store.dispatch(read(instantiate(questionD).getEntity()));
      }}
    >
      {isUnread ? (
        <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />
      ) : (
        <div />
      )}
      <div className={flex}>
        {TranslatableContent.toString(questionD.label)}
      </div>
    </div>
  );
}

function customLabelStyle(
  e: IWhQuestionDescriptor | IQuestionDescriptor,
): string | undefined {
  const isReplied = instantiate(e).isReplied(
    instantiate(Player.selectCurrent()),
  );
  return isReplied ? repliedLabelStyle : undefined;
}
interface QuestionListProps extends DisabledReadonly {
  questionList: SListDescriptor;
  autoOpenFirst?: boolean;
}
export default function QuestionList({
  questionList,
  autoOpenFirst,
  disabled,
  readOnly,
}: QuestionListProps) {
  const entitiesSelector = React.useCallback(() => {
    return {
      questions: flatten<IQuestionDescriptor | IWhQuestionDescriptor>(
        questionList.getEntity(),
        'QuestionDescriptor',
        'WhQuestionDescriptor',
      ).filter(q => {
        const instance =
          getInstance<IQuestionInstance | IWhQuestionInstance>(q);
        if (instance != null) {
          return instance.active;
        }
        return false;
      }),
      player: Player.selectCurrent(),
    };
  }, [questionList]);

  const entities = useStore(entitiesSelector);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  }

  return (
    <EntityChooser
      entities={entities.questions}
      entityLabel={e => <QuestionLabel questionD={e} disabled={disabled} />}
      autoOpenFirst={autoOpenFirst}
      customLabelStyle={customLabelStyle}
      disabled={disabled}
      readOnly={readOnly}
    >
      {ConnectedQuestionDisplay}
    </EntityChooser>
  );
}
