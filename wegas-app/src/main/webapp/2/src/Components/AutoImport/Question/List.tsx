import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { flatten } from '../../../data/selectors/VariableDescriptor';
import { StoreConsumer, StoreDispatch } from '../../../data/store';
import { VariableDescriptor } from '../../../data/selectors';
import { EntityChooser } from '../../EntityChooser';
import { getInstance } from '../../../data/methods/VariableDescriptor';
import { css } from 'emotion';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../../Theme';
import { IconButton } from '../../Button/IconButton';
import { selectAndValidate } from '../../../data/Reducer/variableInstance';

/**
 * Query subtree / instance about a QuestionDescriptor
 * @param question QuestionDescriptor to query
 */
function questionInfo(question: IQuestionDescriptor) {
  const choices = VariableDescriptor.select<IChoiceDescriptor>(
    question.itemsIds,
  ).filter(c => c != null) as Readonly<IChoiceDescriptor>[];
  const choicesInstances = choices.map(c => getInstance(c)());
  return {
    descriptor: question,
    instance: getInstance(question)(),
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
/**
 * Count replies for a given question (current user)
 */
function repliesCount(question: IQuestionDescriptor) {
  const choices = VariableDescriptor.select<IChoiceDescriptor>(
    question.itemsIds,
  );
  return choices.reduce<number>((p, c) => {
    if (c == null) return p;

    const cI = getInstance(c)();
    if (cI == null) return p;
    return p + cI.replies.length;
  }, 0);
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
            ? reply.ignorationAnswer ? TranslatableContent.toString(reply.ignorationAnswer) : ''
            : reply.answer ? TranslatableContent.toString(reply.answer) : '',
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
          <IconButton
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
const choiceContainerStyle = css({
  margin: '1em 2em',
});
const choiceTitleStyle = css({
  borderBottom: '1px solid',
  color: themeVar.primaryColor,
});
const rightFloatStyle = css({
  textAlign: 'right',
});
function ChoiceDisplay({
  descriptor,
  instance,
  onValidate,
  replyAllowed,
}: {
  descriptor: IChoiceDescriptor;
  instance: IChoiceInstance;
  questionDescriptor: IQuestionDescriptor;
  onValidate: (choice: IChoiceDescriptor) => void;
  replyAllowed: boolean;
}) {
  const { maxReplies, description, label } = descriptor;
  const { active, replies } = instance;
  if (!active) {
    return null;
  }
  const canReply =
    replyAllowed &&
    (typeof maxReplies !== 'number' || replies.length < maxReplies);
  return (
    <div className={choiceContainerStyle}>
      <div className={choiceTitleStyle}>
        {TranslatableContent.toString(label)}
      </div>
      <div
        dangerouslySetInnerHTML={{
          __html: description ? TranslatableContent.toString(description) : '',
        }}
      />
      <div className={rightFloatStyle}>
        <IconButton
          icon="check"
          onClick={() => onValidate(descriptor)}
          disabled={!canReply}
          label={replies.length ? replies.length : undefined}
        />
      </div>
    </div>
  );
}
class QuestionDisplay extends React.Component<{
  dispatch: StoreDispatch;
  descriptor: IQuestionDescriptor;
  instance?: IQuestionInstance;
  choices: (IChoiceDescriptor)[];
  replies: IReply[];
  choicesInstances: (IChoiceInstance | undefined)[];
}> {
  onChoiceValidate = (choice: IChoiceDescriptor) => {
    this.props.dispatch(selectAndValidate(choice));
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
            __html: descriptor.description ? TranslatableContent.toString(descriptor.description) : '', 
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
            />
          );
        })}
        <RepliesDisplay replies={replies} />
      </>
    );
  }
}
function ConnectedQuestionDisplay({ entity }: { entity: IQuestionDescriptor }) {
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

export default function QuestionList(props: QuestionProps) {
  return (
    <StoreConsumer
      selector={() => {
        const list = VariableDescriptor.first<IListDescriptor>(
          'name',
          props.variable,
        );
        return flatten<IQuestionDescriptor>(list, 'QuestionDescriptor').filter(
          q => {
            const instance = getInstance(q)();
            if (instance != null) {
              return instance.active;
            }
            return false;
          },
        );
      }}
    >
      {({ state }) => {
        return (
          <EntityChooser
            entities={state}
            entityLabel={e => {
              return (
                <div className={labelStyle}>
                  <div className={labelTextStyle}>
                    {TranslatableContent.toString(e.label)}
                  </div>
                  {repliesCount(e) === 0 && (
                    <FontAwesome style={{ margin: '3px' }} icon="exclamation" />
                  )}
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
