import { css, cx } from '@emotion/css';
import produce from 'immer';
import * as React from 'react';
import {
  IQuestionDescriptor,
  IQuestionInstance,
  IWhQuestionDescriptor,
  IWhQuestionInstance,
  SListDescriptor,
} from 'wegas-ts-api';
import {
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { TranslatableContent } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { read } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { store, useStore } from '../../../data/Stores/store';
import { createTranslatableContent } from '../../../Editor/Components/FormView/translatable';
import {
  IconComp,
  Icons,
  withDefault,
} from '../../../Editor/Components/Views/FontAwesome';
import { getClassLabel, getIcon } from '../../../Editor/editionConfig';
import { classNameOrEmpty } from '../../../Helper/className';
import { wwarn } from '../../../Helper/wegaslog';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { DropMenu } from '../../DropMenu';
import { EntityChooser } from '../../EntityChooser';
import { asyncSFC } from '../../HOC/asyncSFC';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { Validate } from '../../Inputs/Validate';
import { themeVar } from '../../Theme/ThemeVars';
import {
  ConnectedQuestionDisplay,
  ConnectedQuestionDisplayProps,
} from './Question';

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

const questionLabelEditionStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
});

const editButtonStyle = css({
  display: 'flex',
  borderRadius: '50%',
  minWidth: '30px',
  height: '30px',
  marginLeft: 'auto',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid ' + themeVar.colors.PrimaryColor,
  color: themeVar.colors.PrimaryColor,
  '&:hover': {
    border: '1px solid ' + themeVar.colors.ActiveColor,
    color: themeVar.colors.ActiveColor,
  },
});

const questionLabelEditingStyle = css({
  position: 'absolute',
  zIndex: 1000,
});

export function makeMenuFromClass(className: string) {
  const Label = asyncSFC(async () => {
    const entity = {
      '@class': className + 'Descriptor',
    } as IAbstractEntity;
    return (
      <>
        <IconComp icon={withDefault(getIcon(entity), 'question')} />
        {getClassLabel(entity)}
      </>
    );
  });
  return {
    label: <Label />,
    value: {
      descriptor: className + 'Descriptor',
      instance: className + 'Instance',
    },
  };
}

interface AddQuestionsMenuProps {
  questionList: SListDescriptor;
}

function AddQuestionsMenu({ questionList }: AddQuestionsMenuProps) {
  const { lang } = React.useContext(languagesCTX);
  const items = ['Question', 'WhQuestion'].map(makeMenuFromClass);
  return (
    <DropMenu
      // style={style}
      // label={label}
      // prefixedLabel={prefixedLabel}
      items={items}
      icon="plus"
      onSelect={item => {
        store.dispatch(
          Actions.VariableDescriptorActions.createDescriptor(
            {
              '@class': item.value.descriptor,
              label: createTranslatableContent(lang, 'Titre de la question'),
              description: createTranslatableContent(
                lang,
                'Ennoncé de la question',
              ),
              ...(item.value.descriptor === 'QuestionDescriptor'
                ? { maxReplies: 1 }
                : {}),
              defaultInstance: {
                '@class': item.value.instance,
              },
            } as unknown as IVariableDescriptor,
            questionList.getEntity(),
          ),
        );
      }}
    />
  );
}

/*interface QuestionProps {
  variable: string;
}*/

export interface QuestionLabelProps {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
  disabled?: boolean;
  editing?: boolean;
  onFinishEditing?: () => void;
}

export function QuestionLabel({
  questionD,
  disabled,
  editing,
  onFinishEditing,
}: QuestionLabelProps) {
  // const unreadSelector = React.useCallback(() => {
  //   return {
  //     isUnread: instantiate(questionD).getInstance(Player.self()).isUnread(),
  //   };
  // }, [questionD]);
  // const { isUnread } = useStore(unreadSelector);
  const { lang } = React.useContext(languagesCTX);

  const textValue = TranslatableContent.toString(questionD.label);

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

      store.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newQuestion),
      );
      onFinishEditing && onFinishEditing();
    },
    [lang, onFinishEditing, questionD],
  );

  return (
    <div
      className={cx(flex, itemCenter, { [questionLabelEditingStyle]: editing })}
      onClick={() => {
        !disabled &&
          !editing &&
          store.dispatch(read(instantiate(questionD).getEntity()));
      }}
    >
      {/* {isUnread ? (
        <div className={cx(unreadSpaceStyle, unreadSignalStyle)} />
      ) : (
        <div />
      )} */}
      {editing ? (
        <Validate
          value={textValue}
          onValidate={onValidate}
          onCancel={() => onFinishEditing && onFinishEditing()}
          vertical
        >
          {(value, onChange) => (
            <SimpleInput value={value} onChange={onChange} />
          )}
        </Validate>
      ) : (
        <div className={flex}>
          {TranslatableContent.toString(questionD.label)}
        </div>
      )}
    </div>
  );
}

function customLabelStyle(
  e: IWhQuestionDescriptor | IQuestionDescriptor,
): string | undefined {
  try {
    const isReplied = instantiate(e).isReplied(
      instantiate(Player.selectCurrent()),
    );
    return isReplied ? repliedLabelStyle : undefined;
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

function QuestionLabelEdition({ questionD, disabled }: QuestionLabelProps) {
  const [isEditing, setEditing] = React.useState(false);
  const Edit = buttonFactory('edit');
  const Copy = buttonFactory('copy');
  const Trash = buttonFactory('trash');
  return (
    <div className={cx(flex, flexRow)}>
      <div className={grow}>
        <QuestionLabel
          questionD={questionD}
          disabled={disabled}
          editing={isEditing}
          onFinishEditing={() => setEditing(false)}
        />
      </div>
      {!isEditing && (
        <div className={cx(flex, flexColumn, questionLabelEditionStyle)}>
          <Edit
            onClick={e => {
              e.stopPropagation();
              setEditing(true);
            }}
          />
          <Copy
            onClick={e => {
              e.stopPropagation();
              store.dispatch(
                Actions.VariableDescriptorActions.duplicateDescriptor(
                  questionD,
                ),
              );
            }}
          />
          <Trash
            onClick={e => {
              e.stopPropagation();
              store.dispatch(
                Actions.VariableDescriptorActions.deleteDescriptor(questionD),
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

interface QuestionListProps extends DisabledReadonly {
  questionList: SListDescriptor;
  autoOpenFirst?: boolean;
  editMode?: boolean;
}

export default function QuestionList({
  questionList,
  autoOpenFirst,
  disabled,
  readOnly,
  editMode,
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
      entityLabel={e =>
        editMode ? (
          <QuestionLabelEdition questionD={e} disabled={disabled} />
        ) : (
          <QuestionLabel questionD={e} disabled={disabled} />
        )
      }
      autoOpenFirst={autoOpenFirst}
      customLabelStyle={customLabelStyle}
      disabled={disabled}
      readOnly={readOnly}
      addComponent={
        editMode ? <AddQuestionsMenu questionList={questionList} /> : undefined
      }
    >
      {connectedQuestionDisplayFactory(editMode)}
    </EntityChooser>
  );
}

function connectedQuestionDisplayFactory(editMode?: boolean) {
  return function (props: ConnectedQuestionDisplayProps) {
    return <ConnectedQuestionDisplay {...props} editMode={editMode} />;
  };
}
