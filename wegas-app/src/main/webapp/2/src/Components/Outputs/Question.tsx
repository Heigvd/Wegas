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
  readChoice,
  validateQuestion,
} from '../../data/Reducer/VariableInstanceReducer';
import { flatten } from '../../data/selectors/VariableDescriptorSelector';
import {
  getChoices,
  isUnread,
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
} from 'wegas-ts-api';
import { instantiate } from '../../data/scriptable';
import { flex, itemCenter } from '../../css/classes';
import { deepDifferent } from '../Hooks/storeHookFactory';

const unreadSignalStyle = css({ margin: '3px' });
const choiceContainerStyle = css({
  margin: '1em 2em',
});
const choiceTitleStyle = css({
  borderBottom: '1px solid',
  color: themeVar.Common.colors.SecondaryTextColor,
});
const rightFloatStyle = css({
  textAlign: 'right',
});
const disabledQuestionStyle = css({
  backgroundColor: themeVar.Common.colors.DisabledColor,
  cursor: 'not-allowed',
});

/**
 * Query subtree / instance about a QuestionDescriptor
 * @param question QuestionDescriptor to query
 */
function questionInfo(question: IQuestionDescriptor) {
  const choices = getChoices(question);
  const choicesInstances = choices.map(c => getInstance(c));
  return {
    descriptor: question,
    instance: getInstance(question),
    choices,
    choicesInstances,
    replies: choicesInstances
      .reduce<IReply[]>((c, i) => {
        if (i == null) {
          return c;
        }
        return c.concat(i.replies);
      }, [])
      .sort((a, b) => a.createdTime - b.createdTime),
  };
}

function UnreadSignal() {
  return <FontAwesome className={unreadSignalStyle} icon="exclamation" />;
}

function ReplyDisplay({ reply }: { reply: IReply }) {
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
          <div className={choiceTitleStyle}>
            {state != null
              ? TranslatableContent.toString(state.label)
              : 'Unkown choice'}
          </div>
        )}
      </StoreConsumer>

      <div
        dangerouslySetInnerHTML={{
          __html: reply.ignored
            ? reply.ignorationAnswer
              ? TranslatableContent.toString(reply.ignorationAnswer)
              : ''
            : reply.answer
            ? TranslatableContent.toString(reply.answer)
            : '',
        }}
      />
    </div>
  );
}
class RepliesDisplay extends React.Component<
  { replies: IReply[] },
  { showAll: boolean }
> {
  state = { showAll: false };
  toggleAll = () => {
    this.setState(state => ({
      showAll: !state.showAll,
    }));
  };
  render() {
    const { replies } = this.props;
    const { showAll } = this.state;
    if (replies.length === 0) {
      return null;
    }
    return (
      <>
        {replies.length > 1 && (
          <Button
            icon={showAll ? 'caret-square-up' : 'caret-square-down'}
            onClick={this.toggleAll}
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
}

function ChoiceDisplay({
  descriptor,
  instance,
  questionDescriptor,
  onValidate,
  // onHover,
  replyAllowed,
}: {
  descriptor: IChoiceDescriptor;
  instance: IChoiceInstance;
  questionDescriptor: IQuestionDescriptor;
  onValidate: (choice: IChoiceDescriptor) => void;
  // onHover?: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
}) {
  const { maxReplies, description, label } = descriptor;
  const { active, replies /*, unread*/ } = instance;
  if (!active) {
    return null;
  }
  const canReply =
    (replyAllowed &&
      (typeof maxReplies !== 'number' || replies.length < maxReplies)) ||
    (questionDescriptor.cbx && instance.replies.length);

  return (
    <div
      className={cx(
        { [disabledQuestionStyle]: !canReply },
        choiceContainerStyle,
      )}
      // onMouseOver={() => onHover && onHover(descriptor)}
    >
      <div className={choiceTitleStyle}>
        {/* Unread seem to be never used */}
        {/* {unread && <UnreadSignal />} */}
        {TranslatableContent.toString(label)}
      </div>
      <div
        dangerouslySetInnerHTML={{
          __html: description ? TranslatableContent.toString(description) : '',
        }}
      />
      <div className={rightFloatStyle}>
        {questionDescriptor.cbx ? (
          <input
            type="checkbox"
            checked={
              replies.find(r => r.choiceName === descriptor.name) !== undefined
            }
            onChange={() => onValidate(descriptor)}
          />
        ) : (
          <Button
            icon="check"
            onClick={() => onValidate(descriptor)}
            disabled={!canReply}
            label={replies.length ? replies.length : undefined}
          />
        )}
      </div>
    </div>
  );
}
class QuestionDisplay extends React.Component<{
  dispatch: StoreDispatch;
  descriptor: IQuestionDescriptor;
  instance?: IQuestionInstance;
  choices: IChoiceDescriptor[];
  replies: IReply[];
  choicesInstances: (IChoiceInstance | undefined)[];
}> {
  onChoiceValidate = (choice: IChoiceDescriptor) => {
    if (this.props.descriptor.cbx) {
      this.props.dispatch(toggleReply(choice));
    } else {
      this.props.dispatch(selectAndValidate(choice));
    }
  };
  render() {
    const {
      descriptor,
      choices,
      choicesInstances,
      instance,
      replies,
    } = this.props;
    if (instance == null || !instance.active) {
      return null;
    }
    const canReply =
      typeof descriptor.maxReplies !== 'number' ||
      replies.length < descriptor.maxReplies;
    return (
      <>
        <div
          dangerouslySetInnerHTML={{
            __html: descriptor.description
              ? TranslatableContent.toString(descriptor.description)
              : '',
          }}
        />
        {choices.map((choice, i) => {
          const instance = choicesInstances[i];
          if (instance == null) {
            return <span key={choice.id} />;
          }
          return (
            <ChoiceDisplay
              key={choice.id}
              onValidate={this.onChoiceValidate}
              questionDescriptor={descriptor}
              descriptor={choice}
              instance={instance}
              replyAllowed={canReply}
              // onHover={() =>
              //   instance.unread && this.props.dispatch(readChoice(choice))
              // }
            />
          );
        })}
        {descriptor.cbx && (
          <div className={cx(choiceContainerStyle, rightFloatStyle)}>
            <Button
              label={instance.validated ? 'Validated' : 'Validate'}
              onClick={() => this.props.dispatch(validateQuestion(descriptor))}
              disabled={instance.validated}
            />
          </div>
        )}
        <RepliesDisplay replies={replies} />
      </>
    );
  }
}
export function ConnectedQuestionDisplay({
  entity,
}: {
  entity: Readonly<IQuestionDescriptor>;
}) {
  return (
    <StoreConsumer
      selector={() => {
        return questionInfo(entity);
      }}
    >
      {({ state, dispatch }) => (
        <QuestionDisplay {...state} dispatch={dispatch} />
      )}
    </StoreConsumer>
  );
}
const labelStyle = css({
  display: 'flex',
  alignItems: 'center',
});
const labelTextStyle = css({
  flex: '1 1 auto',
});
interface QuestionProps {
  variable: string;
}

export function QuestionLabel({
  questionD,
}: {
  questionD: IQuestionDescriptor;
}) {
  const { isUnread, player } = useStore(() => {
    return {
      isUnread:
        ((VariableDescriptor.select<IChoiceDescriptor>(
          questionD.itemsIds,
        ).filter(c => c != null) || []) as Readonly<IChoiceDescriptor>[])
          .map(cd => getInstance(cd, Player.selectCurrent()))
          .filter(ci => ci && ci.unread).length > 0,
      player: Player.selectCurrent(),
    };
  }, deepDifferent);

  return (
    <div
      className={cx(flex, itemCenter)}
      onClick={() => {
        instantiate(questionD)
          .getItems()
          .map(choice => {
            choice.getInstance(instantiate(player)).isUnread() &&
              store.dispatch(readChoice(choice.getEntity()));
          });
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
          questions: flatten<IQuestionDescriptor>(
            list,
            'QuestionDescriptor',
          ).filter(q => {
            const instance = getInstance(q);
            if (instance != null) {
              return instance.active;
            }
            return false;
          }),
          player: instantiate(Player.selectCurrent()),
        };
      }}
    >
      {({ state, dispatch }) => {
        return (
          <EntityChooser
            entities={state.questions}
            entityLabel={e => {
              return (
                <div
                  className={labelStyle}
                  onClick={() => {
                    instantiate(e)
                      .getItems()
                      .map(choice => {
                        choice.getInstance(state.player).isUnread() &&
                          dispatch(readChoice(choice.getEntity()));
                      });
                  }}
                >
                  {isUnread(e)() && <UnreadSignal />}
                  <div className={labelTextStyle}>
                    {TranslatableContent.toString(e.label)}
                  </div>
                </div>
              );
            }}
          >
            {ConnectedQuestionDisplay}
          </EntityChooser>
        );
      }}
    </StoreConsumer>
  );
}
