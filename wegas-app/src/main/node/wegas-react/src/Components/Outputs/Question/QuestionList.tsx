import { css, cx } from '@emotion/css';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import produce from 'immer';
import * as React from 'react';
import {
  IAbstractEntity,
  IQuestionDescriptor,
  IQuestionInstance,
  IWhQuestionDescriptor,
  IWhQuestionInstance,
  SListDescriptor,
} from 'wegas-ts-api';
import {
  defaultPadding,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  justifyCenter,
  unreadSignalStyle,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { createTranslatableContent } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { read } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import {
  IconComp,
  Icons,
  withDefault,
} from '../../../Editor/Components/Views/FontAwesome';
import { getClassLabel, getIcon } from '../../../Editor/editionConfig';
import { classNameOrEmpty } from '../../../Helper/className';
import { wwarn } from '../../../Helper/wegaslog';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import {
  activeEntityChooserLabel,
  DefaultEntityChooserLabel,
  EntityChooser,
  entityChooserLabelContainer,
  EntityChooserLabelProps,
  entityChooserLabelStyle,
} from '../../EntityChooser';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { useTranslate } from '../../Hooks/useTranslate';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { Validate } from '../../Inputs/Validate';
import { themeVar } from '../../Theme/ThemeVars';
import {
  ConnectedQuestionDisplay,
  QuestionInfo,
  questionInfo,
} from './Question';
import { entityIs } from '../../../data/entities';
import { deepDifferent } from '../../Hooks/storeHookFactory';

const labelStyle = css({
  fontWeight: 'bold',
});
const repliedLabelStyle = cx(
  css({
    backgroundColor: themeVar.colors.HeaderColor,
    color: themeVar.colors.DarkTextColor,
  }),
  'wegas-question__item-replied',
);

export const handleStyle = css({
  position: 'absolute',
  backgroundColor: 'rgba(128, 128, 128, 0.228)',
  borderRadius: '5px',
  left: '100%',
  top: 0,
  zIndex: 2,
});

export const editButtonStyle = css({
  display: 'flex',
  minWidth: '30px',
  height: '30px',
  marginLeft: 'auto',
  justifyContent: 'center',
  alignItems: 'center',
  color: themeVar.colors.PrimaryColor,
  cursor: 'pointer',
  margin: '5px',
  '&:hover': {
    color: themeVar.colors.ActiveColor,
  },
});

export const editButtonBorder = css({
  border: 'solid 2px black',
  borderRadius: '50%',
});

export const singleEditButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: '2px solid black',
  width: '42px',
  height: '42px',
});

export function makeMenuFromClass(className: string) {
  const entity = {
    '@class': className + 'Descriptor',
  } as IAbstractEntity;

  return {
    label: (
      <>
        <IconComp icon={withDefault(getIcon(entity), 'question')} />
        {getClassLabel(entity)}
      </>
    ),
    value: {
      descriptor: className + 'Descriptor',
      instance: className + 'Instance',
    },
  };
}

interface AddQuestionsMenuProps {
  questionList: SListDescriptor;
}

const Plus = buttonFactory('plus');

function AddQuestionButton({ questionList }: AddQuestionsMenuProps) {
  const { lang } = React.useContext(languagesCTX);

  return (
    <div className={cx(flex, justifyCenter, itemCenter)}>
      <Plus
        className={cx(editButtonStyle, editButtonBorder)}
        onClick={() => {
          editingStore.dispatch(
            Actions.VariableDescriptorActions.createDescriptor(
              {
                '@class': 'QuestionDescriptor',
                label: createTranslatableContent(lang, 'Titre de la question'),
                description: createTranslatableContent(
                  lang,
                  'Ennoncé de la question',
                ),
                maxReplies: 1,
                defaultInstance: {
                  '@class': 'QuestionInstance',
                },
              } as unknown as IVariableDescriptor,
              questionList.getEntity(),
            ),
          );
        }}
      />
    </div>
  );
}

interface QuestionLabelProps {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
  editing?: boolean;
  onFinishEditing?: () => void;
}

export function QuestionLabel({
  questionD,
  editing,
  onFinishEditing,
}: QuestionLabelProps) {
  const label = React.useRef<HTMLDivElement>(null);
  const { lang } = React.useContext(languagesCTX);
  useOnClickOutside(label, () => onFinishEditing && onFinishEditing());

  const questionDLabel = useTranslate(questionD.label);
  const isQuestionDescriptor = entityIs(questionD, 'QuestionDescriptor');

  const onValidate = React.useCallback(
    (value: string) => {
      const newQuestion = produce(
        (question: IQuestionDescriptor | IWhQuestionDescriptor) => {
          question.label = createTranslatableContent(
            lang,
            value,
            question.label,
          );
        },
      )(questionD);

      editingStore.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newQuestion),
      );
      onFinishEditing && onFinishEditing();
    },
    [lang, onFinishEditing, questionD],
  );

  return (
    <div
      ref={label}
      className={cx(
        flex,
        itemCenter,
        css({ justifyContent: 'space-between', width: '100%' }),
        'wegas-question__item',
      )}
    >
      {/*{isUnread && <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />}*/}
      {editing ? (
        <Validate
          value={questionDLabel}
          onValidate={onValidate}
          onCancel={() => onFinishEditing && onFinishEditing()}
          vertical
          validatorClassName={css({
            padding: 0,
            backgroundColor: themeVar.colors.HeaderColor,
          })}
          buttonClassName={css({
            color: 'white',
          })}
        >
          {(value, onChange) => (
            <SimpleInput value={value} onChange={onChange} />
          )}
        </Validate>
      ) : (
        <>
          <div className={cx(flex, 'wegas-question__item-label')}>
            {questionDLabel}
          </div>
          {isQuestionDescriptor && (
            <QuestionLabelAnswerIndicator questionD={questionD} />
          )}
        </>
      )}
    </div>
  );
}

function QuestionLabelAnswerIndicator({
  questionD,
}: {
  questionD: IQuestionDescriptor;
}) {
  const question: QuestionInfo = useStore(
    questionInfo(questionD),
    deepDifferent,
  );

  const firstReply = question.choicesI.find(c => (c?.replies || []).length > 0);
  const firstChoice = question.choicesD.find(
    cd => cd.id == firstReply?.parentId,
  );
  const firstAnswerTranslation = useTranslate(firstChoice?.label);

  if (!firstReply) {
    return null;
  }

  let answer: string;
  if (question.questionD?.maxReplies === 1) {
    answer = firstAnswerTranslation;
  } else {
    const count = question.choicesI.reduce((acc, c) => {
      return acc + (c?.replies || []).length;
    }, 0);
    answer = count + 'x';
  }
  return (
    <div
      className={cx(
        css({ opacity: 0.5, textAlign: 'end', marginLeft: '4px' }),
        'wegas-question__item-answer',
      )}
    >
      {answer}
    </div>
  );
}

function QuestionChooser(
  props: EntityChooserLabelProps<IQuestionDescriptor | IWhQuestionDescriptor>,
) {
  const handleClick = () => {
    props.onClick();
    if (!props.disabled) {
      editingStore.dispatch(read(instantiate(props.entity).getEntity()));
    }
  };

  return (
    <DefaultEntityChooserLabel
      {...props}
      customLabelStyle={customLabelStyle}
      onClick={handleClick}
    >
      <div
        className={cx(flex, flexRow, itemCenter, defaultPadding)}
        /* onClick={() => {
          !props.disabled &&
          editingStore.dispatch(read(instantiate(props.entity).getEntity()));
        }}*/
      >
        {props.mobile && (
          <FontAwesomeIcon
            className={css({ marginRight: '5px' })}
            icon={faArrowLeft}
            size="1x"
          />
        )}
        <QuestionLabel questionD={props.entity} />
      </div>
    </DefaultEntityChooserLabel>
  );
}

function customLabelStyle(
  e: IWhQuestionDescriptor | IQuestionDescriptor,
): string | undefined {
  try {
    const player = instantiate(Player.selectCurrent());
    const isUnread = instantiate(e).getInstance(player).isUnread();
    const isReplied = instantiate(e).isReplied(player);

    let style = labelStyle;
    if (isReplied) {
      style = repliedLabelStyle;
    }
    if (isUnread) {
      style += cx(style, unreadSignalStyle, ' wegas-question__item-unread');
    }

    return style;
  } catch (e) {
    wwarn(e);
    return undefined;
  }
}

interface EditmodeButtonProps extends ClassStyleId {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function buttonFactory(icon: Icons) {
  return function ({ onClick, className, style, id }: EditmodeButtonProps) {
    return (
      <div
        id={id}
        style={style}
        className={editButtonStyle + classNameOrEmpty(className)}
        onClick={onClick}
      >
        <IconComp icon={icon} />
      </div>
    );
  };
}

const Edit = buttonFactory('edit');
const Copy = buttonFactory('copy');
const Trash = buttonFactory('trash');

function QuestionChooserEdition({
  entity,
  onClick,
  selected,
  disabled,
}: EntityChooserLabelProps<IQuestionDescriptor | IWhQuestionDescriptor>) {
  const [isEditing, setEditing] = React.useState(false);
  const [showHandle, setShowHandle] = React.useState(false);

  return (
    <div
      key={entity.id}
      className={cx(flex, flexRow, itemCenter, entityChooserLabelContainer)}
      style={{ position: 'relative' }}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      <div
        className={cx(
          entityChooserLabelStyle(disabled),
          customLabelStyle && customLabelStyle(entity),
          {
            [activeEntityChooserLabel]: selected,
          },
        )}
      >
        <div className={cx(flex, flexRow)}>
          <div className={grow}>
            <QuestionLabel
              questionD={entity}
              editing={isEditing}
              onFinishEditing={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
      {!isEditing && showHandle && (
        <div className={cx(flex, flexColumn, handleStyle)}>
          <Edit
            onClick={e => {
              e.stopPropagation();
              setEditing(true);
            }}
          />
          <Copy
            onClick={e => {
              e.stopPropagation();
              editingStore.dispatch(
                Actions.VariableDescriptorActions.duplicateDescriptor(entity),
              );
            }}
          />
          <Trash
            onClick={e => {
              e.stopPropagation();
              editingStore.dispatch(
                Actions.VariableDescriptorActions.deleteDescriptor(entity),
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

interface QuestionListProps extends DisabledReadonly, ClassStyleId {
  questionList: SListDescriptor;
  autoOpenFirst?: boolean;
  mobileDisplay?: boolean;
  editMode?: boolean;
}

export default function QuestionList({
  questionList,
  autoOpenFirst,
  mobileDisplay,
  disabled,
  readOnly,
  editMode,
  className,
  style,
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
      EntityLabel={editMode ? QuestionChooserEdition : QuestionChooser}
      autoOpenFirst={autoOpenFirst}
      mobileDisplay={mobileDisplay}
      disabled={disabled}
      readOnly={readOnly}
      addComponent={
        editMode ? <AddQuestionButton questionList={questionList} /> : undefined
      }
      className={className}
      style={style}
    >
      {props => <ConnectedQuestionDisplay {...props} editMode={editMode} />}
    </EntityChooser>
  );
}
