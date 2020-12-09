import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import {
  store,
  StoreConsumer,
  StoreDispatch,
  useStore,
} from '../../data/store';
import { Player, VariableDescriptor } from '../../data/selectors';
import { EntityChooser } from '../EntityChooser';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { css, cx } from 'emotion';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import {
  selectAndValidate,
  toggleReply,
  read,
  validateQuestion,
  updateInstance,
} from '../../data/Reducer/VariableInstanceReducer';
import { flatten } from '../../data/selectors/VariableDescriptorSelector';
import {
  getChoices,
  IWhChoiceDescriptor,
  IWhChoiceInstance,
} from '../../data/scriptable/impl/QuestionDescriptor';
import { Button } from '../Inputs/Buttons/Button';
import { themeVar } from '../Style/ThemeVars';
import {
  IQuestionDescriptor,
  IReply,
  IChoiceDescriptor,
  IChoiceInstance,
  IQuestionInstance,
  IListDescriptor,
  IWhQuestionDescriptor,
  IWhQuestionInstance,
  IBooleanInstance,
} from 'wegas-ts-api';
import { instantiate } from '../../data/scriptable';
import { flex, itemCenter } from '../../css/classes';
import { deepDifferent } from '../Hooks/storeHookFactory';
import { CheckBox } from '../Inputs/Boolean/CheckBox';
import { cloneDeep } from 'lodash-es';
import { entityIs } from '../../data/entities';
import { classOrNothing } from '../../Helper/className';

const unreadSignalStyle = css({ margin: '3px' });

const choiceContainerStyle = css({
  margin: '1em 2em',
  boxShadow: '0 0 5px grey',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  '&.disabled': {
    backgroundColor: themeVar.Common.colors.DisabledColor,
  },
});
const choiceLabelStyle = css({
  borderBottom: '1px solid',
  color: themeVar.Common.colors.TextColor,
  padding: '5px',
});
const choiceDescriptionStyle = css({
  padding: '5px',
});
const rightFloatStyle = css({
  textAlign: 'right',
});

const disabledChoiceStyle = css({
  '&>button': {
    cursor: 'not-allowed',
  },
});
// const disabledQuestionStyle = css({
//   backgroundColor: themeVar.Common.colors.DisabledColor,
//   cursor: 'not-allowed',
// });

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
function questionInfo(question: IQuestionDescriptor): QuestionInfo {
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

interface WhQuestionInfo {
  questionD: Readonly<IWhQuestionDescriptor>;
  questionI: Readonly<IWhQuestionInstance> | undefined;
  choicesD: Readonly<IWhChoiceDescriptor>[];
  choicesI: (Readonly<IWhChoiceInstance> | undefined)[];
}

function whQuestionInfo(question: IWhQuestionDescriptor): WhQuestionInfo {
  const choicesD = getChoices(question);
  const choicesI = choicesD.map(c => getInstance<IWhChoiceInstance>(c));
  return {
    questionD: question,
    questionI: getInstance(question),
    choicesD,
    choicesI,
  };
}

interface ReplyDisplayProps {
  reply: IReply;
}

function ReplyDisplay({ reply }: ReplyDisplayProps) {
  const ignorationAnswer = reply.ignorationAnswer;
  const answer = reply.answer;

  return (
    <div className={choiceContainerStyle}>
      <StoreConsumer
        selector={() =>
          VariableDescriptor.firstMatch<IChoiceDescriptor>({
            name: reply.choiceName,
          })
        }
      >
        {({ state }) => (
          <div className={choiceLabelStyle}>
            {state != null
              ? TranslatableContent.toString(state.label)
              : 'Unkown choice'}
          </div>
        )}
      </StoreConsumer>

      <div
        dangerouslySetInnerHTML={{
          __html: reply.ignored
            ? ignorationAnswer
              ? TranslatableContent.toString(ignorationAnswer)
              : ''
            : answer
            ? TranslatableContent.toString(answer)
            : '',
        }}
      />
    </div>
  );
}

interface RepliesDisplayProps {
  replies: Readonly<IReply[]>;
}
function RepliesDisplay({ replies }: RepliesDisplayProps) {
  const [showAll, setShowAll] = React.useState(false);

  if (replies.length === 0) {
    return null;
  }
  return (
    <>
      {replies.length > 1 && (
        <Button
          icon={showAll ? 'caret-square-up' : 'caret-square-down'}
          onClick={() => setShowAll(showAll => !showAll)}
        />
      )}
      {showAll ? (
        replies.map(r => <ReplyDisplay key={r.id} reply={r} />)
      ) : (
        <ReplyDisplay reply={replies[replies.length - 1]} />
      )}
    </>
  );
}

function ChoiceContainer({
  descriptor,
  active,
  canReply,
  children,
}: React.PropsWithChildren<{
  descriptor: {
    label?: ITranslatableContent;
    description?: ITranslatableContent;
  };
  active: boolean;
  canReply: boolean;
}>) {
  const { description, label } = descriptor;

  if (!active) {
    return null;
  }

  return (
    <div className={choiceContainerStyle + (canReply ? '' : ' disabled')}>
      {label && (
        <div className={choiceLabelStyle}>
          {TranslatableContent.toString(label)}
        </div>
      )}
      {description && (
        <div
          className={choiceDescriptionStyle}
          dangerouslySetInnerHTML={{
            __html: TranslatableContent.toString(description),
          }}
        />
      )}
      <div className={rightFloatStyle}>{children}</div>
    </div>
  );
}

interface ChoiceDisplayProps {
  choiceD: IChoiceDescriptor;
  choiceI: IChoiceInstance;
  questionD: IQuestionDescriptor;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
}

function ChoiceDisplay({
  choiceD,
  choiceI,
  questionD,
  onValidate,
  replyAllowed,
}: ChoiceDisplayProps) {
  const { maxReplies } = choiceD;
  const { active, replies } = choiceI;

  if (!active) {
    return null;
  }
  const canReply =
    (replyAllowed &&
      (typeof maxReplies !== 'number' || replies.length < maxReplies)) ||
    (questionD.cbx && choiceI.replies.length > 0);

  return (
    <ChoiceContainer active={active} descriptor={choiceD} canReply={canReply}>
      {questionD.cbx ? (
        <input
          className={classOrNothing(disabledChoiceStyle, !canReply)}
          type="checkbox"
          checked={
            replies.find(r => r.choiceName === choiceD.name) !== undefined
          }
          onChange={() => onValidate(choiceD)}
        />
      ) : (
        <Button
          className={classOrNothing(disabledChoiceStyle, !canReply)}
          icon="check"
          onClick={() => onValidate(choiceD)}
          disabled={!canReply}
          label={replies.length ? replies.length : undefined}
        />
      )}
    </ChoiceContainer>
  );
}

interface QuestionDisplayProps extends QuestionInfo {
  dispatch: StoreDispatch;
}

function QuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  replies,
}: QuestionDisplayProps) {
  const onChoiceValidate = React.useCallback(
    (choice: IChoiceDescriptor) => {
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
            replyAllowed={canReply}
          />
        );
      })}
      {questionD.cbx && (
        <div className={cx(choiceContainerStyle, rightFloatStyle)}>
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

interface WhChoiceDisplayProps {
  choiceD: IWhChoiceDescriptor;
  choiceI: IWhChoiceInstance;
  questionI: IWhQuestionInstance;
  onChange: (choiceI: IWhChoiceInstance) => void;
}
function WhChoiceDisplay({
  choiceD,
  choiceI,
  questionI,
  onChange,
}: WhChoiceDisplayProps) {
  return (
    <ChoiceContainer
      active
      descriptor={choiceD}
      canReply={!questionI.validated}
    >
      {choiceD['@class'] === 'BooleanDescriptor' ? (
        <CheckBox
          className={classOrNothing(disabledChoiceStyle, questionI.validated)}
          value={(choiceI as IBooleanInstance).value}
          onChange={v => {
            const newChoiceI = cloneDeep(choiceI as IBooleanInstance);
            newChoiceI.value = v;
            onChange(newChoiceI);
          }}
          disabled={questionI.validated}
        />
      ) : null}
    </ChoiceContainer>
  );
}

interface WhQuestionDisplayProps extends WhQuestionInfo {
  dispatch: StoreDispatch;
}

function WhQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
}: WhQuestionDisplayProps) {
  const [choicesValues, setChoicesValues] = React.useState<
    (IWhChoiceInstance | undefined)[]
  >(choicesI);

  if (questionI == null || !questionI.active) {
    return null;
  }

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
        // switch (choiceD['@class']) {
        //   case 'BooleanDescriptor': {
        //     return (
        //       <CheckBox
        //         label={translate(choiceD.label, lang)}
        //         value={(choiceI as IBooleanInstance).value}
        //         onChange={v =>
        //           setChoicesValues(oldValues => {
        //             const newValues = oldValues;
        //             const newChoiceI = cloneDeep(choiceI as IBooleanInstance);
        //             newChoiceI.value = v;
        //             newValues[i] = newChoiceI;
        //             return newValues;
        //           })
        //         }
        //       />
        //     );
        //   }
        // }

        return (
          <WhChoiceDisplay
            key={choiceD.id}
            onChange={newChoiceI =>
              setChoicesValues(oldValues => {
                const newValues = oldValues;
                newValues[i] = newChoiceI;
                return newValues;
              })
            }
            questionI={questionI}
            choiceD={choiceD}
            choiceI={choiceI}
          />
        );
      })}
      <div className={cx(choiceContainerStyle, rightFloatStyle)}>
        <Button
          label={questionI.validated ? 'Validated' : 'Validate'}
          onClick={() => {
            dispatch(validateQuestion(questionD));
            choicesValues.forEach(
              choiceI => choiceI != null && dispatch(updateInstance(choiceI)),
            );
          }}
          disabled={questionI.validated}
        />
      </div>
      {/* <RepliesDisplay replies={replies} /> */}
    </>
  );
}

export function ConnectedSimpleQuestionDisplay({
  entity,
}: {
  entity: Readonly<IQuestionDescriptor>;
}) {
  const selector = React.useCallback(() => questionInfo(entity), [entity]);
  const state = useStore(selector);
  return <QuestionDisplay {...state} dispatch={store.dispatch} />;
}

export function ConnectedWhQuestionDisplay({
  entity,
}: {
  entity: Readonly<IWhQuestionDescriptor>;
}) {
  const selector = React.useCallback(() => whQuestionInfo(entity), [entity]);
  const state = useStore(selector);
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

interface QuestionProps {
  variable: string;
}

export function QuestionLabel({
  questionD,
}: {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
}) {
  const { isUnread } = useStore(() => {
    const player = instantiate(Player.selectCurrent());
    return {
      isUnread: instantiate(questionD).getInstance(player).isUnread(),
    };
  }, deepDifferent);

  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => {
        store.dispatch(read(instantiate(questionD).getEntity()));
      }}
    >
      <div className={flex}>
        {TranslatableContent.toString(questionD.label)}
      </div>
      {isUnread && (
        <FontAwesome className={unreadSignalStyle} icon="exclamation" />
      )}
    </div>
  );
}

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
