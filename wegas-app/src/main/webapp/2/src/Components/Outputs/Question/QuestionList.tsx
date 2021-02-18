import { cx, css } from 'emotion';
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
import { themeVar } from '../../Style/ThemeVars';
import { ConnectedQuestionDisplay } from './Question';


const repliedLabelStyle = css({
  backgroundColor: themeVar.Common.colors.LightTextColor,
  color: themeVar.Common.colors.PrimaryColor,
  border: "2px solid " + themeVar.Common.colors.PrimaryColor,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: themeVar.Common.colors.LightTextColor,
    color: themeVar.Common.colors.ActiveColor,
    border: "2px solid " + themeVar.Common.colors.ActiveColor,
  },
});

/*interface QuestionProps {
  variable: string;
}*/

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
        <div />
      )}
      <div className={flex}>
        {TranslatableContent.toString(questionD.label)}
      </div>
    </div>
  );
}

function customLabelStyle(e:IWhQuestionDescriptor | IQuestionDescriptor):string | undefined {
    const isReplied = instantiate(e).isReplied(instantiate(Player.selectCurrent()));
    return isReplied ? repliedLabelStyle : undefined;
}
interface QuestionListProps {
  questionList:SListDescriptor,
  autoOpenFirst?: boolean,
}
export default function QuestionList({
  questionList,
  autoOpenFirst,
}: QuestionListProps) {
  const entitiesSelector = React.useCallback(() => {
       return {
      questions: flatten<IQuestionDescriptor | IWhQuestionDescriptor>(
        questionList.getEntity(),
        'QuestionDescriptor',
        'WhQuestionDescriptor',
      ).filter(q => {
        const instance = getInstance<IQuestionInstance | IWhQuestionInstance>(
          q,
        );
        if (instance != null) {
          return instance.active;
        }
        return false;
      }),
      player:Player.selectCurrent()
    };
  }, [questionList]);

  const entities = useStore(entitiesSelector);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  }

  return (
    <EntityChooser
      entities={entities.questions}
      entityLabel={e => <QuestionLabel questionD={e} />}
      autoOpenFirst={autoOpenFirst}
      customLabelStyle={customLabelStyle}
    >
      {ConnectedQuestionDisplay}
    </EntityChooser>
  );
}
