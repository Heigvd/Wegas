import { css, cx } from '@emotion/css';
import produce from 'immer';
import * as React from 'react';
import { IChoiceDescriptor, ISingleResultChoiceDescriptor } from 'wegas-ts-api';
import {
  defaultMarginBottom,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { IWhChoiceDescriptor } from '../../../data/scriptable/impl/QuestionDescriptor';
import { store } from '../../../data/Stores/store';
import {
  createTranslatableContent,
  useTranslate,
} from '../../../Editor/Components/FormView/translatable';
import { classNameOrEmpty } from '../../../Helper/className';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTML/HTMLEditor';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { TumbleLoader } from '../../Loader';
import { themeVar } from '../../Theme/ThemeVars';
import { HTMLText } from '../HTMLText';
import { buttonFactory, handleStyle } from './QuestionList';

export const choiceContainerStyle = css({
  position: 'relative',
  margin: '1em 0',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.HeaderColor,
  '&.selected': {
    backgroundColor: themeVar.colors.PrimaryColor,
    color: themeVar.colors.LightTextColor,
    cursor: 'default',
  },
  '&.editing': {
    '&:hover': {
      backgroundColor: themeVar.colors.HeaderColor,
      color: themeVar.colors.DarkTextColor,
    },
  },
  '&.disabled': {
    backgroundColor: themeVar.colors.BackgroundColor,
    opacity: '0.7',
    cursor: 'initial',
    //pointerEvents: 'none',
    '&:hover': {
      backgroundColor: themeVar.colors.BackgroundColor,
      color: themeVar.colors.DarkTextColor,
    },
    '&.selected': {
      backgroundColor: themeVar.colors.PrimaryColor,
      color: themeVar.colors.LightTextColor,
      '&:hover': {
        backgroundColor: themeVar.colors.PrimaryColor,
      },
    },
  },
});
const choiceContentStyle = css({
  padding: '15px',
});
export const choiceLabelStyle = css({
  fontWeight: 'bold',
});
export const choiceDescriptionStyle = css({
  paddingTop: '5px',
});
export const choiceInputStyle = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '5px',
});
const editButtonsContainer = css({
  margin: '5px',
});
const clickedOverlay = css({
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(128,128,128,0.228)',
  borderRadius: themeVar.dimensions.BorderRadius,
  display: 'flex',
  alignItems: 'center',
});

interface ChoiceContainerProps {
  descriptor:
    | IChoiceDescriptor
    | ISingleResultChoiceDescriptor
    | IWhChoiceDescriptor;
  active: boolean;
  canReply: boolean;
  className?: string;
  inputClassName?: string;
  onClick?: () => void;
  hasBeenSelected: boolean;
  editMode?: boolean;
}

export function ChoiceContainer({
  descriptor,
  active,
  canReply,
  children,
  className,
  inputClassName,
  onClick,
  hasBeenSelected,
  editMode,
}: React.PropsWithChildren<ChoiceContainerProps>) {
  const { label } = descriptor;

  const description = entityIs(descriptor, 'ChoiceDescriptor', true)
    ? descriptor.description
    : undefined;
  const feedback =
    entityIs(descriptor, 'ChoiceDescriptor', true) &&
    descriptor.results?.length > 0
      ? descriptor.results[0].answer
      : undefined;
  const [showHandle, setShowHandle] = React.useState(false);
  const [isEditing, setEditing] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const { lang } = React.useContext(languagesCTX);

  const Edit = buttonFactory('pen');
  const Trash = buttonFactory('trash');

  const labelText = useTranslate(label);
  const descriptionText = useTranslate(description);
  const feedbackText = useTranslate(feedback);

  const [values, setValues] = React.useState<{
    label?: string;
    description?: string;
    feedback?: string;
  }>({
    label: labelText,
    description: descriptionText,
    feedback: feedbackText,
  });

  React.useEffect(() => {
    setValues({
      label: labelText,
      description: descriptionText,
      feedback: feedbackText,
    });
  }, [descriptionText, feedbackText, labelText]);

  React.useEffect(() => {
    setClicked(false);
  }, [descriptor]);

  const onValidate = React.useCallback(() => {
    const newChoice = produce(
      (
        choice:
          | IChoiceDescriptor
          | ISingleResultChoiceDescriptor
          | IWhChoiceDescriptor,
      ) => {
        const {
          label: newLabel,
          description: newDescription,
          feedback: newFeedback,
        } = values;
        if (newLabel) {
          choice.label = createTranslatableContent(
            lang,
            newLabel,
            choice.label,
          );
        }
        if (newDescription && entityIs(choice, 'ChoiceDescriptor', true)) {
          choice.description = createTranslatableContent(
            lang,
            newDescription,
            choice.description,
          );
        }
        if (
          newFeedback &&
          entityIs(choice, 'ChoiceDescriptor', true) &&
          choice.results?.length > 0
        ) {
          choice.results[0].answer = createTranslatableContent(
            lang,
            newFeedback,
            choice.results[0].answer,
          );
        }
      },
    )(descriptor);

    store.dispatch(
      Actions.VariableDescriptorActions.updateDescriptor(newChoice),
    );
    setEditing(false);
  }, [descriptor, lang, values]);

  if (!active) {
    return null;
  }

  return (
    <div
      className={
        cx(choiceContainerStyle, classNameOrEmpty(className)) +
        (hasBeenSelected ? ' selected' : '') +
        (canReply && !clicked ? '' : ' disabled') +
        (isEditing ? ' editing' : '')
      }
      onClick={() => {
        if (onClick && !isEditing) {
          setClicked(true);
          onClick();
        }
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      {clicked && (
        <div className={clickedOverlay}>
          <TumbleLoader />
        </div>
      )}
      {isEditing ? (
        <div className={cx(flex, flexColumn, css({ padding: '15px' }))}>
          <div className={cx(flex, flexColumn, defaultMarginBottom)}>
            <div className={choiceLabelStyle}>Label</div>
            <SimpleInput
              value={values.label}
              onChange={value =>
                setValues(o => ({ ...o, label: String(value) }))
              }
            />
          </div>
          {entityIs(descriptor, 'ChoiceDescriptor', true) && (
            <>
              <div className={cx(flex, flexColumn, defaultMarginBottom)}>
                <div className={choiceLabelStyle}>Description</div>
                <HTMLEditor
                  value={values.description}
                  onChange={value =>
                    setValues(o => ({ ...o, description: value }))
                  }
                  customToolbar="bold italic underline bullist"
                />
              </div>
              <div className={cx(flex, flexColumn, defaultMarginBottom)}>
                <div className={choiceLabelStyle}>Feedback</div>
                <HTMLEditor
                  value={values.feedback}
                  onChange={value =>
                    setValues(o => ({ ...o, feedback: value }))
                  }
                  customToolbar="bold italic underline bullist"
                />
              </div>
            </>
          )}
          <div
            className={cx(flex, flexRow, flexDistribute, editButtonsContainer)}
          >
            <IconButton
              icon="times"
              onClick={e => {
                e.stopPropagation();
                setEditing(false);
              }}
              chipStyle
            />
            <IconButton
              icon="check"
              onClick={e => {
                e.stopPropagation();
                onValidate();
              }}
              chipStyle
            />
          </div>
        </div>
      ) : (
        <div className={cx(flex, flexColumn)}>
          <div className={choiceContentStyle}>
            {label && (
              <HTMLText className={choiceLabelStyle} text={labelText} />
            )}
            {description && (
              <HTMLText
                className={choiceDescriptionStyle}
                text={descriptionText}
              />
            )}
          </div>
          <div className={choiceInputStyle + classNameOrEmpty(inputClassName)}>
            {children}
          </div>
        </div>
      )}
      {editMode && showHandle && (
        <div className={handleStyle}>
          <Edit
            onClick={e => {
              e.stopPropagation();
              setEditing(true);
            }}
          />
          <Trash
            onClick={e => {
              e.stopPropagation();
              store.dispatch(
                Actions.VariableDescriptorActions.deleteDescriptor(descriptor),
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
