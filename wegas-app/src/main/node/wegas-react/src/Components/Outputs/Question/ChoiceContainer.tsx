import { css, cx } from '@emotion/css';
import produce from 'immer';
import * as React from 'react';
import { IChoiceDescriptor, ISingleResultChoiceDescriptor } from 'wegas-ts-api';
import {
  defaultMarginBottom,
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  stretch,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { createTranslatableContent } from '../../../data/i18n';
import { IWhChoiceDescriptor } from '../../../data/scriptable/impl/QuestionDescriptor';
import { editingStore } from '../../../data/Stores/editingStore';
import { classNameOrEmpty } from '../../../Helper/className';
import { componentsTranslations } from '../../../i18n/components/components';
import { useInternalPlayerLangTranslate } from '../../../i18n/internalTranslator';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useTranslate } from '../../Hooks/useTranslate';
import HTMLEditor from '../../HTML/HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
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
  backgroundColor: themeVar.colors.BackgroundColor,
  '&.selected': {
    cursor: 'default',
  },
  '&.editing': {
    '&:hover': {
      backgroundColor: themeVar.colors.HeaderColor,
      color: themeVar.colors.DarkTextColor,
    },
  },
  '&.disabled, &.loading': {
    backgroundColor: themeVar.colors.BackgroundColor,
    opacity: '0.7',
    cursor: 'cursor',
    pointerEvents: 'none',
  },
  '&.no-desc': {
    '&.no-label': {
      boxShadow: 'none',
      borderRadius: '0',
      paddingTop: '15px',
      borderTop: `1px solid ${themeVar.colors.DisabledColor}`,
      '&.disabled': {
        display: 'none',
      },
    },
  },
});
export const choiceHeaderStyle = css({
  fontWeight: 'bold',
  padding: '15px',
  backgroundColor: themeVar.colors.HoverColor,
  borderTopRightRadius: themeVar.dimensions.BorderRadius,
  borderTopLeftRadius: themeVar.dimensions.BorderRadius,
  '&.selected': {
    color: themeVar.colors.LightTextColor,
    backgroundColor: themeVar.colors.PrimaryColor,
  },
});
export const choiceDescriptionStyle = css({
  width: '100%',
  padding: '10px 15px 10px 15px',
});
export const choiceButtonStyle = css({
  padding: '15px',
  float: 'right',
  flexDirection: 'row',
  display: 'flex',
  justifyContent: 'end',
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
  onClick?: () => Promise<unknown>;
  hasBeenSelected: boolean;
  editMode?: boolean;
  replyCount?: number;
  validateButton?: boolean;
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
  replyCount = undefined,
  validateButton = true,
}: React.PropsWithChildren<ChoiceContainerProps>) {
  const i18nValues = useInternalPlayerLangTranslate(componentsTranslations);
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

    editingStore.dispatch(
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
        (hasBeenSelected && !canReply ? ' selected' : '') +
        (canReply ? '' : ' disabled') +
        (clicked ? ' loading' : '') +
        (isEditing ? ' editing' : '') +
        (label && labelText !== '' ? '' : ' no-label') +
        (description && descriptionText !== '' ? '' : ' no-desc')
      }
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
            <div
              className={cx(choiceHeaderStyle, 'wegas-question__choice-header')}
            >
              Label
            </div>
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
                <div
                  className={cx(
                    choiceHeaderStyle,
                    'wegas-question__choice-header',
                  )}
                >
                  Description
                </div>
                <HTMLEditor
                  value={values.description}
                  onChange={value =>
                    setValues(o => ({ ...o, description: value }))
                  }
                  toolbarLayout="player"
                />
              </div>
              <div className={cx(flex, flexColumn, defaultMarginBottom)}>
                <div
                  className={cx(
                    choiceHeaderStyle,
                    'wegas-question__choice-header',
                  )}
                >
                  Feedback
                </div>
                <HTMLEditor
                  value={values.feedback}
                  onChange={value =>
                    setValues(o => ({ ...o, feedback: value }))
                  }
                  toolbarLayout="player"
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
        <div className={cx(flex, flexColumn, expandWidth)}>
          <div className={cx(flex, flexColumn)}>
            {label && labelText !== '' && (
              <HTMLText
                className={cx(
                  choiceHeaderStyle,
                  stretch,
                  hasBeenSelected && !canReply ? ' selected' : '',
                  'wegas-question__choice-label',
                )}
                text={labelText}
              />
            )}
            {description && descriptionText !== '' && (
              <HTMLText
                className={cx(
                  choiceDescriptionStyle,
                  'wegas-question__choice-description',
                )}
                text={descriptionText}
              />
            )}

            {canReply && validateButton && (
              <div
                className={cx(
                  choiceButtonStyle,
                  'wegas-question__choice-button',
                )}
              >
                {replyCount !== undefined && (
                  <p className={css({ opacity: 0.5, marginRight: 8 })}>
                    {replyCount}x
                  </p>
                )}
                <Button
                  style={{ float: 'right' }}
                  onClick={async () => {
                    if (canReply && onClick && !isEditing) {
                      setClicked(true);
                      await onClick();
                      setClicked(false);
                    }
                  }}
                >
                  {i18nValues.question.validate}
                </Button>
              </div>
            )}
          </div>
          {children && (
            <div
              className={choiceInputStyle + classNameOrEmpty(inputClassName)}
            >
              {children}
            </div>
          )}
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
              editingStore.dispatch(
                Actions.VariableDescriptorActions.deleteDescriptor(descriptor),
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
